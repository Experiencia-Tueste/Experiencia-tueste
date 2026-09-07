import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  getCurrentAdmin: vi.fn(),
  engagementRepository: {
    findByIdForUpdate: vi.fn(),
    setRadioStage: vi.fn(),
    linkRadioActivation: vi.fn(),
  },
  radioRepository: {
    findCompanyById: vi.fn(),
    createOrGetCompany: vi.fn(),
    findChannelById: vi.fn(),
    createOrGetChannel: vi.fn(),
  },
  appendAudit: vi.fn(),
}));

vi.mock('@/db/client', () => ({
  getDb: () => ({ transaction: mocks.transaction }),
}));
vi.mock('@/lib/auth/authorization', () => ({
  getCurrentAdmin: mocks.getCurrentAdmin,
}));
vi.mock('@/db/admin-engagement-repository', () => ({
  getEngagementRepository: () => mocks.engagementRepository,
}));
vi.mock('@/db/admin-radio-repository', () => ({
  getAdminRadioRepository: () => mocks.radioRepository,
}));
vi.mock('@/db/admin-identity-repository', () => ({
  getAdminRepository: () => ({ appendAudit: mocks.appendAudit }),
}));
vi.mock('@/db/admin-event-repository', () => ({
  getAdminEventRepository: vi.fn(),
}));

import { activateRadioOpportunity, changeRadioOpportunityStage } from '../service';

const ADMIN = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'admin@tueste.co',
  name: 'Admin',
  role: 'owner' as const,
  capabilities: ['crm.manage', 'radio.manage'] as never,
};

const REQUEST = {
  id: '11111111-1111-4111-8111-111111111111',
  type: 'radio' as const,
  requesterUserId: '33333333-3333-4333-8333-333333333333',
  requesterEmail: 'ana@example.com',
  requesterName: 'Ana',
  reference: 'disenada',
  details: 'Diseñada por Tueste · USD 20/mes',
  payload: {
    company: 'Café Norte',
    responsible: 'Ana',
    city: 'Bogotá',
    businessType: 'Café',
    locations: 2,
    hours: '8:00–18:00',
    consent: true,
  },
  status: 'pending' as const,
  radioStage: 'won' as const,
  radioCompanyId: null,
  radioChannelId: null,
  marketStage: null,
  createdAt: '2026-09-07T12:00:00.000Z',
  updatedAt: '2026-09-07T12:00:00.000Z',
};

describe('operación comercial de Radio Origen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentAdmin.mockResolvedValue(ADMIN);
    mocks.transaction.mockImplementation((callback: (tx: object) => unknown) => callback({}));
    mocks.engagementRepository.findByIdForUpdate.mockResolvedValue(REQUEST);
    mocks.radioRepository.createOrGetCompany.mockResolvedValue({
      created: true,
      row: { id: '44444444-4444-4444-8444-444444444444', city: 'Bogotá' },
    });
    mocks.radioRepository.createOrGetChannel.mockResolvedValue({
      created: true,
      row: {
        id: '55555555-5555-4555-8555-555555555555',
        subscriptionStatus: 'pending',
      },
    });
    mocks.engagementRepository.linkRadioActivation.mockResolvedValue({
      ...REQUEST,
      radioCompanyId: '44444444-4444-4444-8444-444444444444',
      radioChannelId: '55555555-5555-4555-8555-555555555555',
    });
  });

  it('rechaza saltos de etapa no permitidos', async () => {
    await expect(
      changeRadioOpportunityStage({
        id: REQUEST.id,
        from: 'new',
        to: 'won',
        reason: 'Cierre directo no permitido',
      }),
    ).rejects.toThrow('transición de Radio no permitida');
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('convierte una oportunidad ganada en una empresa y canal pendientes, con auditoría', async () => {
    const result = await activateRadioOpportunity({
      id: REQUEST.id,
      reason: 'Aprobación comercial y confirmación del alcance',
    });

    expect(mocks.radioRepository.createOrGetCompany).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Café Norte',
        contactEmail: 'ana@example.com',
      }),
      expect.anything(),
    );
    expect(mocks.radioRepository.createOrGetChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: '44444444-4444-4444-8444-444444444444',
        planId: 'disenada',
      }),
      expect.anything(),
    );
    expect(mocks.engagementRepository.linkRadioActivation).toHaveBeenCalledWith(
      REQUEST.id,
      '44444444-4444-4444-8444-444444444444',
      '55555555-5555-4555-8555-555555555555',
      expect.anything(),
    );
    expect(mocks.appendAudit).toHaveBeenCalledTimes(3);
    expect(result.channel.subscriptionStatus).toBe('pending');
  });

  it('impide activar una oportunidad perdida', async () => {
    mocks.engagementRepository.findByIdForUpdate.mockResolvedValue({
      ...REQUEST,
      radioStage: 'lost',
    });

    await expect(
      activateRadioOpportunity({
        id: REQUEST.id,
        reason: 'Intento inválido de activación',
      }),
    ).rejects.toThrow('Solo una oportunidad ganada');
    expect(mocks.radioRepository.createOrGetCompany).not.toHaveBeenCalled();
    expect(mocks.radioRepository.createOrGetChannel).not.toHaveBeenCalled();
  });

  it('es idempotente al repetir la activación de una oportunidad ganada', async () => {
    const linkedRequest = {
      ...REQUEST,
      radioCompanyId: '44444444-4444-4444-8444-444444444444',
      radioChannelId: '55555555-5555-4555-8555-555555555555',
    };
    mocks.engagementRepository.findByIdForUpdate
      .mockResolvedValueOnce(REQUEST)
      .mockResolvedValueOnce(linkedRequest);
    mocks.radioRepository.findCompanyById.mockResolvedValue({ id: linkedRequest.radioCompanyId });
    mocks.radioRepository.findChannelById.mockResolvedValue({
      id: linkedRequest.radioChannelId,
      subscriptionStatus: 'pending',
    });

    await activateRadioOpportunity({ id: REQUEST.id, reason: 'Activación aprobada' });
    const repeated = await activateRadioOpportunity({ id: REQUEST.id, reason: 'Reintento seguro' });

    expect(repeated.request).toEqual(linkedRequest);
    expect(mocks.radioRepository.createOrGetCompany).toHaveBeenCalledTimes(1);
    expect(mocks.radioRepository.createOrGetChannel).toHaveBeenCalledTimes(1);
    expect(mocks.engagementRepository.linkRadioActivation).toHaveBeenCalledTimes(1);
    expect(mocks.appendAudit).toHaveBeenCalledTimes(3);
  });
});
