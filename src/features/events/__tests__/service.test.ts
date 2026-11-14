import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listEvents: vi.fn(),
  listAttendees: vi.fn(),
}));

vi.mock('@/db/admin-event-repository', () => ({
  getAdminEventRepository: () => mocks,
}));

import { getPublicEvents } from '../service';

const NOW = new Date('2026-09-07T12:00:00.000Z');

function event(
  id: string,
  status: 'draft' | 'open' | 'waitlist' | 'closed' | 'cancelled',
  startsAt: string,
  capacity: number | null = 10,
) {
  return {
    id,
    title: `Evento ${id}`,
    slug: id,
    startsAt,
    endsAt: null,
    city: 'Bogotá',
    venue: 'Casa Tueste',
    capacity,
    status,
    createdAt: startsAt,
    updatedAt: startsAt,
  } as const;
}

describe('servicio público de eventos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listAttendees.mockResolvedValue([]);
  });

  it('publica solo eventos futuros operables y calcula pocos cupos/lista de espera', async () => {
    mocks.listEvents.mockResolvedValue([
      event('open', 'open', '2026-09-10T19:00:00.000Z', 2),
      event('full', 'open', '2026-09-11T19:00:00.000Z', 1),
      event('wait', 'waitlist', '2026-09-12T19:00:00.000Z'),
      event('closed', 'closed', '2026-09-13T19:00:00.000Z'),
      event('cancelled', 'cancelled', '2026-09-14T19:00:00.000Z'),
      event('draft', 'draft', '2026-09-15T19:00:00.000Z'),
      event('past', 'open', '2026-09-01T19:00:00.000Z'),
    ]);
    mocks.listAttendees.mockResolvedValue([
      { eventId: 'open', status: 'reserved' },
      { eventId: 'full', status: 'reserved' },
    ]);

    const events = await getPublicEvents(NOW);

    expect(events.map((item) => item.id)).toEqual(['open', 'full', 'wait']);
    expect(events.map((item) => item.status)).toEqual(['few', 'wait', 'wait']);
    expect(events.every((item) => item.cta !== 'Realizado')).toBe(true);
  });
});
