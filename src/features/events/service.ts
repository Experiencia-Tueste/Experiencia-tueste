import 'server-only';

import { getAdminEventRepository } from '@/db/admin-event-repository';
import type { AdminEventRow } from '@/features/admin/event-types';
import { isEventPast, type EventItem, type EventStatus, type EventType } from './index';

function eventType(title: string): EventType {
  const normalized = title.toLowerCase();
  if (normalized.includes('cata') || normalized.includes('listening')) return 'LISTENING';
  if (normalized.includes('live') || normalized.includes('club')) return 'CLUB';
  if (normalized.includes('lanzamiento')) return 'LANZAMIENTO';
  return 'RITUAL';
}

function publicStatus(event: AdminEventRow, occupied: number): EventStatus {
  if (event.status === 'waitlist') return 'wait';
  if (event.capacity !== null && occupied >= event.capacity) return 'wait';
  if (event.capacity !== null && event.capacity - occupied <= 1) return 'few';
  return 'open';
}

function toPublicEvent(event: AdminEventRow, occupied: number): EventItem {
  const start = new Date(event.startsAt);
  const status = publicStatus(event, occupied);
  return {
    id: event.id,
    day: new Intl.DateTimeFormat('es-CO', { day: '2-digit', timeZone: 'UTC' }).format(start),
    month: new Intl.DateTimeFormat('es-CO', { month: 'short', timeZone: 'UTC' })
      .format(start)
      .replace('.', '')
      .toUpperCase(),
    year: new Intl.DateTimeFormat('es-CO', { year: 'numeric', timeZone: 'UTC' }).format(start),
    dateTime: event.startsAt,
    type: eventType(event.title),
    title: event.title,
    city: event.city,
    venue: event.venue,
    time: new Intl.DateTimeFormat('es-CO', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Bogota',
    }).format(start),
    price: '',
    status,
    cta: status === 'wait' ? 'Lista de espera' : status === 'past' ? 'Realizado' : 'Solicitar cupo',
  };
}

/** Solo eventos futuros operables llegan a la experiencia pública. */
export async function getPublicEvents(now = new Date()): Promise<EventItem[]> {
  const repository = getAdminEventRepository();
  const [events, attendees] = await Promise.all([
    repository.listEvents(),
    repository.listAttendees(),
  ]);
  return events
    .filter((event) => ['open', 'waitlist'].includes(event.status))
    .filter((event) => !isEventPast({ dateTime: event.endsAt ?? event.startsAt }, now))
    .map((event) => {
      const occupied = attendees.filter(
        (attendee) =>
          attendee.eventId === event.id && ['reserved', 'checked_in'].includes(attendee.status),
      ).length;
      return toPublicEvent(event, occupied);
    });
}
