import 'server-only';

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { getAdminEventRepository } from '@/db/admin-event-repository';
import { getEngagementRepository } from '@/db/admin-engagement-repository';
import { getAdminRepository } from '@/db/admin-identity-repository';
import { getCurrentAdmin } from '@/lib/auth/authorization';
import { parseAuditEntry } from './audit';
import type { CurrentAdmin } from './authorization-core';
import { isEventPast } from '@/features/events';
import { buildEventAudit } from './event-audit';
import {
  ATTENDEE_CREATE_SCHEMA,
  CHECK_IN_SCHEMA,
  EVENT_CREATE_SCHEMA,
  EVENT_CONFIRM_REQUEST_SCHEMA,
  EVENT_FILTER_SCHEMA,
  EVENT_STATUS_SCHEMA,
  canTransitionEvent,
} from './event-schemas';
import type { EventFilters } from './event-schemas';
import type { AdminEventWorkspace } from './event-types';

function assertEventCapability(
  admin: CurrentAdmin,
  capability: 'events.read' | 'events.manage' | 'events.checkin',
) {
  if (!admin.capabilities.includes(capability)) {
    throw new Error(`403: se requiere la capacidad ${capability}.`);
  }
}

async function requireEventCapability(capability: 'events.manage' | 'events.checkin') {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('401: sesión administrativa requerida.');
  assertEventCapability(admin, capability);
  return admin;
}

export async function getEventWorkspace(
  admin: CurrentAdmin,
  rawFilters: EventFilters = {},
): Promise<AdminEventWorkspace[]> {
  assertEventCapability(admin, 'events.read');
  const filters = EVENT_FILTER_SCHEMA.parse(rawFilters);
  const repository = getAdminEventRepository();
  const [events, attendees, requests] = await Promise.all([
    repository.listEvents(),
    repository.listAttendees(),
    getEngagementRepository().list(),
  ]);
  const from = filters.from ? new Date(`${filters.from}T00:00:00.000Z`) : null;
  const to = filters.to ? new Date(`${filters.to}T23:59:59.999Z`) : null;
  return events
    .filter((event) => !filters.status || event.status === filters.status)
    .filter(
      (event) => !filters.city || event.city.toLowerCase().includes(filters.city.toLowerCase()),
    )
    .filter((event) => !from || new Date(event.startsAt) >= from)
    .filter((event) => !to || new Date(event.startsAt) <= to)
    .map((event) => {
      const eventAttendees = attendees.filter((attendee) => attendee.eventId === event.id);
      const eventRequests = requests
        .filter((request) => request.type === 'event' && request.reference === event.id)
        .map((request) => ({
          id: request.id,
          requesterName: request.requesterName,
          requesterEmail: request.requesterEmail,
          attendeeCount:
            typeof request.payload.attendeeCount === 'number' ? request.payload.attendeeCount : 1,
          status: request.status,
          createdAt: request.createdAt,
        }));
      return {
        ...event,
        attendees: eventAttendees,
        requests: eventRequests,
        reservedCount: eventAttendees.filter((attendee) =>
          ['reserved', 'checked_in'].includes(attendee.status),
        ).length,
        checkedInCount: eventAttendees.filter((attendee) => attendee.status === 'checked_in')
          .length,
      };
    });
}

export async function createAdminEvent(input: unknown) {
  const admin = await requireEventCapability('events.manage');
  const parsed = EVENT_CREATE_SCHEMA.parse(input);
  return getDb().transaction(async (tx) => {
    const event = await getAdminEventRepository().createEvent({ ...parsed, actorId: admin.id }, tx);
    await getAdminRepository().appendAudit(
      buildEventAudit(admin, {
        action: 'event.created',
        targetType: 'event',
        targetId: event.id,
        reason: parsed.reason,
        metadata: { startsAt: event.startsAt, city: event.city },
      }),
      tx,
    );
    return event;
  });
}

export async function transitionAdminEvent(input: unknown) {
  const admin = await requireEventCapability('events.manage');
  const parsed = EVENT_STATUS_SCHEMA.parse(input);
  if (!canTransitionEvent(parsed.from, parsed.to))
    throw new Error('400: transición de evento inválida.');
  return getDb().transaction(async (tx) => {
    const event = await getAdminEventRepository().setStatus(
      parsed.id,
      parsed.from,
      parsed.to,
      admin.id,
      tx,
    );
    if (!event) throw new Error('409: el evento cambió de estado o no existe.');
    await getAdminRepository().appendAudit(
      buildEventAudit(admin, {
        action: 'event.status_changed',
        targetType: 'event',
        targetId: event.id,
        reason: parsed.reason,
        metadata: { from: parsed.from, to: parsed.to },
      }),
      tx,
    );
    return event;
  });
}

export async function registerEventAttendee(input: unknown) {
  const admin = await requireEventCapability('events.manage');
  const parsed = ATTENDEE_CREATE_SCHEMA.parse(input);
  return getDb().transaction(async (tx) => {
    const repository = getAdminEventRepository();
    await repository.lockEvent(parsed.eventId, tx);
    const event = await repository.findEvent(parsed.eventId, tx);
    if (!event || !['open', 'waitlist'].includes(event.status))
      throw new Error('409: el evento no recibe reservas.');
    const occupied = await repository.countOccupied(event.id, tx);
    const status =
      event.status === 'waitlist' || (event.capacity !== null && occupied >= event.capacity)
        ? 'waitlisted'
        : 'reserved';
    const attendee = await repository.createAttendee({ ...parsed, status, actorId: admin.id }, tx);
    await getAdminRepository().appendAudit(
      buildEventAudit(admin, {
        action: 'event.attendee_registered',
        targetType: 'event_attendee',
        targetId: attendee.id,
        reason: parsed.reason,
        metadata: { eventId: event.id, status },
      }),
      tx,
    );
    return attendee;
  });
}

/** Confirma una solicitud pública de evento de forma idempotente y auditable. */
export async function confirmEventEngagementRequest(input: unknown) {
  const admin = await requireEventCapability('events.manage');
  const parsed = EVENT_CONFIRM_REQUEST_SCHEMA.parse(input);
  return getDb().transaction(async (tx) => {
    const engagementRepository = getEngagementRepository();
    const eventRepository = getAdminEventRepository();
    const request = await engagementRepository.findByIdForUpdate(parsed.requestId, tx);
    if (!request || request.type !== 'event') {
      throw new Error('404: la solicitud de evento no existe.');
    }

    const eventIdResult = z.string().uuid().safeParse(request.reference);
    if (!eventIdResult.success) {
      throw new Error('409: la solicitud apunta a un evento inválido.');
    }
    const eventId = eventIdResult.data;
    const existing = await eventRepository.findAttendeeByEventEmail(
      eventId,
      request.requesterEmail,
      tx,
    );
    if (existing) return existing;
    if (request.status === 'closed') {
      throw new Error('409: la solicitud ya fue cerrada sin un asistente asociado.');
    }

    await eventRepository.lockEvent(eventId, tx);
    const event = await eventRepository.findEvent(eventId, tx);
    if (
      !event ||
      !['open', 'waitlist'].includes(event.status) ||
      isEventPast({ dateTime: event.endsAt ?? event.startsAt })
    ) {
      throw new Error('409: el evento ya no puede confirmar solicitudes.');
    }

    const occupied = await eventRepository.countOccupied(event.id, tx);
    const status =
      event.status === 'waitlist' || (event.capacity !== null && occupied >= event.capacity)
        ? 'waitlisted'
        : 'reserved';
    const attendee = await eventRepository.createAttendee(
      {
        eventId: event.id,
        name: request.requesterName,
        email: request.requesterEmail,
        status,
        actorId: admin.id,
      },
      tx,
    );
    const closed = await engagementRepository.setStatus(request.id, request.status, 'closed', tx);
    if (!closed) throw new Error('409: la solicitud cambió de estado.');

    await getAdminRepository().appendAudit(
      buildEventAudit(admin, {
        action: 'event.attendee_registered',
        targetType: 'event_attendee',
        targetId: attendee.id,
        reason: parsed.reason,
        metadata: { eventId: event.id, status, engagementRequestId: request.id },
      }),
      tx,
    );
    await getAdminRepository().appendAudit(
      parseAuditEntry({
        id: randomUUID(),
        actorUserId: admin.id,
        actorEmail: admin.email,
        action: 'engagement.status_changed',
        targetType: 'engagement_request',
        targetId: request.id,
        occurredAt: new Date().toISOString(),
        reason: parsed.reason,
        metadata: {
          from: request.status,
          to: 'closed',
          eventId: event.id,
          attendeeId: attendee.id,
        },
      }),
      tx,
    );
    return attendee;
  });
}

export async function checkInEventAttendee(input: unknown) {
  const admin = await requireEventCapability('events.checkin');
  const parsed = CHECK_IN_SCHEMA.parse(input);
  return getDb().transaction(async (tx) => {
    const attendee = await getAdminEventRepository().checkIn(
      parsed.eventId,
      parsed.ticketCode,
      admin.id,
      tx,
    );
    if (!attendee) throw new Error('409: ticket inválido, cancelado o ya utilizado.');
    await getAdminRepository().appendAudit(
      buildEventAudit(admin, {
        action: 'event.checked_in',
        targetType: 'event_attendee',
        targetId: attendee.id,
        reason: parsed.reason,
        metadata: { eventId: parsed.eventId },
      }),
      tx,
    );
    return attendee;
  });
}
