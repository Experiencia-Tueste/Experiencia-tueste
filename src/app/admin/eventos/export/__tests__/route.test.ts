import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireCapability: vi.fn().mockResolvedValue({
    id: '22222222-2222-4222-8222-222222222222',
    email: 'admin@tueste.co',
    capabilities: ['events.export'],
  }),
  getEventWorkspace: vi.fn().mockResolvedValue([
    {
      title: 'Cata Sonora',
      city: 'Bogotá',
      startsAt: '2026-09-10T19:00:00.000Z',
      status: 'open',
      attendees: [
        {
          name: '=2+2',
          email: 'ana@example.com',
          ticketCode: '11111111-1111-4111-8111-111111111111',
          status: 'reserved',
        },
      ],
    },
  ]),
}));

vi.mock('@/lib/auth/authorization', () => ({
  requireCapability: mocks.requireCapability,
}));
vi.mock('@/features/admin/event-service', () => ({
  getEventWorkspace: mocks.getEventWorkspace,
}));

import { GET } from '../route';

describe('exportación de asistentes de eventos', () => {
  it('exige events.export y entrega CSV privado con protección de fórmulas', async () => {
    const response = await GET(new Request('http://localhost/admin/eventos/export?status=open'));
    const csv = await response.text();

    expect(mocks.requireCapability).toHaveBeenCalledWith('events.export');
    expect(mocks.getEventWorkspace).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'open' }),
    );
    expect(response.headers.get('content-type')).toContain('text/csv');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(csv).toContain("'=2+2");
  });
});
