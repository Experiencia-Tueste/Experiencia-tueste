import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  dbTransaction: vi.fn(),
  eventRepository: {
    findAttendeeByEventEmail: vi.fn(),
    lockEvent: vi.fn(),
    findEvent: vi.fn(),
    countOccupied: vi.fn(),
    createAttendee: vi.fn(),
  },
  engagementRepository: {
    findByIdForUpdate: vi.fn(),
    setStatus: vi.fn(),
  },
  appendAudit: vi.fn(),
  getCurrentAdmin: vi.fn(),
}));

vi.mock('@/db/client', () => ({
  getDb: () => ({ transaction: mocks.dbTransaction }),
}));
vi.mock('@/db/admin-event-repository', () => ({
  getAdminEventRepository: () => mocks.eventRepository,
}));
vi.mock('@/db/admin-engagement-repository', () => ({
  getEngagementRepository: () => mocks.engagementRepository,
}));
vi.mock('@/db/admin-identity-repository', () => ({
  getAdminRepository: () => ({ appendAudit: mocks.appendAudit }),
}));
vi.mock('@/lib/auth/authorization', () => ({
  getCurrentAdmin: mocks.getCurrentAdmin,
}));

import { confirmEventEngagementRequest } from '../event-service';

const ADMIN = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'admin@tueste.co',
  name: 'Admin',
  role: 'admin' as const,
  capabilities: ['events.manage'] as never,
};
const REQUEST = {
  id: '11111111-1111-4111-8111-111111111111',
  type: 'event' as const,
  requesterUserId: '33333333-3333-4333-8333-333333333333',
  requesterEmail: 'ana@example.com',
  requesterName: 'Ana',
  reference: '44444444-4444-4444-8444-444444444444',
  details: 'Evento',
  payload: { attendeeCount: 1, consent: true },
  status: 'pending' as const,
  radioStage: null,
  radioCompanyId: null,
  radioChannelId: null,
  marketStage: null,
  marketVendorId: null,
  createdAt: '2026-09-07T12:00:00.000Z',
  updatedAt: '2026-09-07T12:00:00.000Z',
};
const EVENT = {
  id: REQUEST.reference,
  title: 'Cata',
  slug: 'cata',
  startsAt: '2026-09-10T19:00:00.000Z',
  endsAt: null,
  city: 'Bogotá',
  venue: 'Casa Tueste',
  capacity: 1,
  status: 'open' as const,
  createdAt: '2026-09-07T12:00:00.000Z',
  updatedAt: '2026-09-07T12:00:00.000Z',
};

describe('confirmación de solicitudes de evento', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentAdmin.mockResolvedValue(ADMIN);
    mocks.dbTransaction.mockImplementation((callback: (tx: object) => unknown) => callback({}));
    mocks.engagementRepository.findByIdForUpdate.mockResolvedValue(REQUEST);
    mocks.eventRepository.findAttendeeByEventEmail.mockResolvedValue(null);
    mocks.eventRepository.findEvent.mockResolvedValue(EVENT);
    mocks.eventRepository.countOccupied.mockResolvedValue(0);
    mocks.eventRepository.createAttendee.mockResolvedValue({
      id: '55555555-5555-4555-8555-555555555555',
      eventId: EVENT.id,
      name: REQUEST.requesterName,
      email: REQUEST.requesterEmail,
      ticketCode: '66666666-6666-4666-8666-666666666666',
      status: 'reserved',
      checkedInAt: null,
      createdAt: '2026-09-07T12:00:00.000Z',
    });
    mocks.engagementRepository.setStatus.mockResolvedValue({ ...REQUEST, status: 'closed' });
  });

  it('crea un asistente, cierra la solicitud y escribe dos trazas', async () => {
    const attendee = await confirmEventEngagementRequest({
      requestId: REQUEST.id,
      reason: 'Cupo confirmado por el equipo',
    });

    expect(attendee.status).toBe('reserved');
    expect(mocks.eventRepository.lockEvent).toHaveBeenCalledWith(EVENT.id, expect.anything());
    expect(mocks.engagementRepository.setStatus).toHaveBeenCalledWith(
      REQUEST.id,
      'pending',
      'closed',
      expect.anything(),
    );
    expect(mocks.appendAudit).toHaveBeenCalledTimes(2);
  });

  it('manda a espera cuando el último cupo ya fue ocupado', async () => {
    mocks.eventRepository.countOccupied.mockResolvedValue(1);

    await confirmEventEngagementRequest({
      requestId: REQUEST.id,
      reason: 'Registrar en lista de espera',
    });

    expect(mocks.eventRepository.createAttendee).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'waitlisted' }),
      expect.anything(),
    );
  });

  it('es idempotente si la solicitud ya tiene asistente', async () => {
    const existing = { id: '77777777-7777-4777-8777-777777777777', status: 'reserved' };
    mocks.eventRepository.findAttendeeByEventEmail.mockResolvedValue(existing);

    await expect(
      confirmEventEngagementRequest({ requestId: REQUEST.id, reason: 'Reintento seguro' }),
    ).resolves.toEqual(existing);
    expect(mocks.eventRepository.createAttendee).not.toHaveBeenCalled();
    expect(mocks.engagementRepository.setStatus).not.toHaveBeenCalled();
  });
});
