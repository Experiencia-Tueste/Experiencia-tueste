import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  getCurrentAdmin: vi.fn(),
  engagementRepository: {
    createOrGet: vi.fn(),
    findByIdForUpdate: vi.fn(),
    setMarketStage: vi.fn(),
    linkMarketVendor: vi.fn(),
  },
  createOrGetVendorMembership: vi.fn(),
  appendAudit: vi.fn(),
  publicMarketRepository: {
    findPublishedById: vi.fn(),
  },
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
vi.mock('@/db/admin-identity-repository', () => ({
  getAdminRepository: () => ({
    createOrGetVendorMembership: mocks.createOrGetVendorMembership,
    appendAudit: mocks.appendAudit,
  }),
}));
vi.mock('@/db/admin-event-repository', () => ({
  getAdminEventRepository: vi.fn(),
}));
vi.mock('@/db/admin-radio-repository', () => ({
  getAdminRadioRepository: vi.fn(),
}));
vi.mock('@/db/public-market-repository', () => ({
  getPublicMarketRepository: () => mocks.publicMarketRepository,
}));

import { changeMarketApplicationStage, createEngagementRequest } from '../service';

const ADMIN = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'admin@tueste.co',
  name: 'Admin',
  role: 'owner' as const,
  capabilities: ['crm.manage', 'market.manage'] as never,
};

const REQUEST = {
  id: '11111111-1111-4111-8111-111111111111',
  type: 'market' as const,
  requesterUserId: '33333333-3333-4333-8333-333333333333',
  requesterEmail: 'ana@example.com',
  requesterName: 'Ana',
  reference: 'seller-onboarding',
  details: 'Finca Roble · Café tostado · Quindío',
  payload: {
    intent: 'seller_application' as const,
    brand: 'Finca Roble',
    responsible: 'Ana',
    region: 'Quindío',
    category: 'Café tostado',
    consent: true,
  },
  status: 'pending' as const,
  radioStage: null,
  radioCompanyId: null,
  radioChannelId: null,
  marketStage: 'review' as const,
  marketVendorId: null,
  createdAt: '2026-09-07T12:00:00.000Z',
  updatedAt: '2026-09-07T12:00:00.000Z',
};

const LISTING = {
  id: '44444444-4444-4444-8444-444444444444',
  title: 'Café Roble',
  brand: 'Marca Roble',
  category: 'Café tostado',
  origin: 'Quindío',
};

describe('aprobación operativa de vendedores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentAdmin.mockResolvedValue(ADMIN);
    mocks.transaction.mockImplementation((callback: (tx: object) => unknown) => callback({}));
    mocks.engagementRepository.findByIdForUpdate.mockResolvedValue(REQUEST);
    mocks.engagementRepository.createOrGet.mockResolvedValue({
      created: true,
      request: { id: 'request-id' },
    });
    mocks.publicMarketRepository.findPublishedById.mockResolvedValue(LISTING);
    mocks.createOrGetVendorMembership.mockResolvedValue({
      createdVendor: true,
      createdMembership: true,
      vendor: { id: '44444444-4444-4444-8444-444444444444' },
    });
    mocks.engagementRepository.setMarketStage.mockResolvedValue({
      ...REQUEST,
      marketStage: 'approved',
    });
    mocks.engagementRepository.linkMarketVendor.mockResolvedValue({
      ...REQUEST,
      marketStage: 'approved',
      marketVendorId: '44444444-4444-4444-8444-444444444444',
    });
  });

  it('rechaza saltos directos de enviada a aprobada', async () => {
    await expect(
      changeMarketApplicationStage({
        id: REQUEST.id,
        from: 'submitted',
        to: 'approved',
        reason: 'Aprobación sin revisión',
      }),
    ).rejects.toThrow('transición de vendedor no permitida');
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('canoniza la disponibilidad desde una publicación publicada', async () => {
    await createEngagementRequest(
      { id: '55555555-5555-4555-8555-555555555555', email: 'cliente@example.com' },
      {
        type: 'market',
        reference: LISTING.id,
        payload: { intent: 'availability', itemSlug: 'valor-manipulado' },
      },
    );

    expect(mocks.engagementRepository.createOrGet).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: `availability:${LISTING.id}`,
        details: 'Marca Roble · Café tostado · Quindío',
        payload: expect.objectContaining({
          listingId: LISTING.id,
          itemSlug: 'cafe-roble-44444444',
        }),
      }),
      expect.anything(),
    );
  });

  it('rechaza una referencia manipulada o pausada antes de crear la solicitud', async () => {
    mocks.publicMarketRepository.findPublishedById.mockResolvedValue(null);

    await expect(
      createEngagementRequest(
        { id: '55555555-5555-4555-8555-555555555555', email: 'cliente@example.com' },
        {
          type: 'market',
          reference: '66666666-6666-4666-8666-666666666666',
          payload: { intent: 'availability', itemSlug: 'cafe-roble-44444444' },
        },
      ),
    ).rejects.toThrow('producto no existe');
    expect(mocks.engagementRepository.createOrGet).not.toHaveBeenCalled();
  });

  it('rechaza una referencia que ni siquiera tiene formato de listing', async () => {
    await expect(
      createEngagementRequest(
        { id: '55555555-5555-4555-8555-555555555555', email: 'cliente@example.com' },
        {
          type: 'market',
          reference: 'valor-manipulado',
          payload: { intent: 'availability', itemSlug: 'cafe-roble-44444444' },
        },
      ),
    ).rejects.toThrow('producto no existe');
    expect(mocks.publicMarketRepository.findPublishedById).not.toHaveBeenCalled();
    expect(mocks.engagementRepository.createOrGet).not.toHaveBeenCalled();
  });

  it('aprueba en una transacción y crea vendedor, membresía y rol', async () => {
    const result = await changeMarketApplicationStage({
      id: REQUEST.id,
      from: 'review',
      to: 'approved',
      reason: 'Marca y datos comerciales verificados',
    });

    expect(mocks.createOrGetVendorMembership).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: REQUEST.requesterUserId,
        name: 'Finca Roble',
        email: 'ana@example.com',
      }),
      expect.anything(),
    );
    expect(mocks.engagementRepository.linkMarketVendor).toHaveBeenCalledWith(
      REQUEST.id,
      '44444444-4444-4444-8444-444444444444',
      expect.anything(),
    );
    expect(mocks.appendAudit).toHaveBeenCalledTimes(2);
    expect(result.marketVendorId).toBe('44444444-4444-4444-8444-444444444444');
  });

  it('rechaza sin crear acceso de vendedor', async () => {
    mocks.engagementRepository.setMarketStage.mockResolvedValue({
      ...REQUEST,
      marketStage: 'rejected',
    });
    const result = await changeMarketApplicationStage({
      id: REQUEST.id,
      from: 'review',
      to: 'rejected',
      reason: 'No cumple los criterios de la categoría',
    });

    expect(mocks.createOrGetVendorMembership).not.toHaveBeenCalled();
    expect(mocks.engagementRepository.linkMarketVendor).not.toHaveBeenCalled();
    expect(result.marketStage).toBe('rejected');
    expect(mocks.appendAudit).toHaveBeenCalledTimes(1);
  });

  it('repetir una aprobación devuelve el vínculo existente sin duplicar', async () => {
    const linked = {
      ...REQUEST,
      marketStage: 'approved' as const,
      marketVendorId: '44444444-4444-4444-8444-444444444444',
    };
    mocks.engagementRepository.findByIdForUpdate.mockResolvedValue(linked);

    const result = await changeMarketApplicationStage({
      id: REQUEST.id,
      from: 'approved',
      to: 'approved',
      reason: 'Reintento seguro',
    });

    expect(result).toEqual(linked);
    expect(mocks.createOrGetVendorMembership).not.toHaveBeenCalled();
    expect(mocks.engagementRepository.setMarketStage).not.toHaveBeenCalled();
    expect(mocks.appendAudit).not.toHaveBeenCalled();
  });
});
