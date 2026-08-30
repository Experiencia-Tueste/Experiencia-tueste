import { describe, expect, it } from 'vitest';

import { ATTENDEE_CREATE_SCHEMA, EVENT_CREATE_SCHEMA, canTransitionEvent } from '../event-schemas';

describe('contratos administrativos de eventos', () => {
  it('normaliza slug y datos de un evento válido', () => {
    const event = EVENT_CREATE_SCHEMA.parse({
      title: 'Cata nocturna',
      slug: 'Cata Nocturna',
      startsAt: '2026-09-10T19:00:00-05:00',
      endsAt: '2026-09-10T21:00:00-05:00',
      city: 'Bogotá',
      venue: 'Casa Tueste',
      capacity: '40',
      reason: 'Programación inicial',
    });
    expect(event.slug).toBe('cata-nocturna');
    expect(event.capacity).toBe(40);
  });

  it('rechaza una fecha final anterior al inicio', () => {
    expect(() =>
      EVENT_CREATE_SCHEMA.parse({
        title: 'Cata',
        slug: 'cata',
        startsAt: '2026-09-10T21:00:00-05:00',
        endsAt: '2026-09-10T19:00:00-05:00',
        city: 'Bogotá',
        venue: 'Casa Tueste',
        reason: 'Programación inicial',
      }),
    ).toThrow();
  });

  it('normaliza el correo del asistente', () => {
    const attendee = ATTENDEE_CREATE_SCHEMA.parse({
      eventId: '11111111-1111-4111-8111-111111111111',
      name: 'Ana',
      email: ' ANA@EXAMPLE.COM ',
      reason: 'Reserva telefónica',
    });
    expect(attendee.email).toBe('ana@example.com');
  });

  it('solo permite transiciones operativas explícitas', () => {
    expect(canTransitionEvent('draft', 'open')).toBe(true);
    expect(canTransitionEvent('open', 'waitlist')).toBe(true);
    expect(canTransitionEvent('closed', 'open')).toBe(false);
    expect(canTransitionEvent('cancelled', 'open')).toBe(false);
  });
});
