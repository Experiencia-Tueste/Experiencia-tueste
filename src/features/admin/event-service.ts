import 'server-only';

import { getDb } from '@/db/client';
import { getAdminEventRepository } from '@/db/admin-event-repository';
import { getAdminRepository } from '@/db/admin-identity-repository';
import { getCurrentAdmin } from '@/lib/auth/authorization';
import type { CurrentAdmin } from './authorization-core';
import { buildEventAudit } from './event-audit';
import {
  ATTENDEE_CREATE_SCHEMA,
  CHECK_IN_SCHEMA,
  EVENT_CREATE_SCHEMA,
  EVENT_STATUS_SCHEMA,
  canTransitionEvent,
} from './event-schemas';

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

export async function getEventWorkspace(admin: CurrentAdmin) {
  assertEventCapability(admin, 'events.read');
  const repository = getAdminEventRepository();
  const [events, attendees] = await Promise.all([
    repository.listEvents(),
    repository.listAttendees(),
  ]);
  return events.map((event) => {
    const eventAttendees = attendees.filter((attendee) => attendee.eventId === event.id);
    return {
      ...event,
      attendees: eventAttendees,
      reservedCount: eventAttendees.filter((attendee) =>
        ['reserved', 'checked_in'].includes(attendee.status),
      ).length,
      checkedInCount: eventAttendees.filter((attendee) => attendee.status === 'checked_in').length,
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
