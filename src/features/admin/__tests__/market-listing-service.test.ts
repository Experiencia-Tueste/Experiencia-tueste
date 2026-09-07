import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  getCurrentAdmin: vi.fn(),
  repository: {
    createListing: vi.fn(),
    findListingByIdForUpdate: vi.fn(),
    updateListing: vi.fn(),
    setListingStatus: vi.fn(),
    marketWorkspace: vi.fn(),
  },
  appendAudit: vi.fn(),
  findVendorByUserId: vi.fn(),
}));

vi.mock('@/db/client', () => ({
  getDb: () => ({ transaction: mocks.transaction }),
}));
vi.mock('@/lib/auth/authorization', () => ({
  getCurrentAdmin: mocks.getCurrentAdmin,
}));
vi.mock('@/db/admin-identity-repository', () => ({
  getAdminRepository: () => ({
    appendAudit: mocks.appendAudit,
    findVendorByUserId: mocks.findVendorByUserId,
  }),
}));
vi.mock('@/db/admin-operations-repository', () => ({
  getAdminOperationsRepository: () => mocks.repository,
}));

import {
  changeMarketListingStatus,
  createVendorListing,
  getMarketWorkspace,
  submitVendorListingForReview,
  updateVendorListing,
} from '../operations-service';

const SELLER = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'seller@example.com',
  name: 'Seller',
  role: 'vendedor' as const,
  vendorId: '22222222-2222-4222-8222-222222222222',
  capabilities: ['admin.access', 'market.read', 'market.self'] as never,
};
const OWNER = {
  ...SELLER,
  id: '33333333-3333-4333-8333-333333333333',
  email: 'owner@example.com',
  name: 'Owner',
  role: 'owner' as const,
  capabilities: ['admin.access', 'market.read', 'market.manage'] as never,
  vendorId: undefined,
};
const LISTING = {
  id: '44444444-4444-4444-8444-444444444444',
  vendorId: SELLER.vendorId,
  title: 'Café Roble',
  brand: 'Finca Roble',
  category: 'Café tostado',
  variety: 'Castillo',
  process: 'Lavado',
  origin: 'Quindío',
  presentation: 'Bolsa de 340 g',
  weightGrams: 340,
  inventory: 12,
  priceCents: 4500000,
  imagePath: null,
  imageSizeBytes: 0,
  delivery: 'Envío nacional',
  traceability: 'Lote QR-001',
  status: 'draft',
  notes: null,
  createdBy: SELLER.id,
  updatedBy: SELLER.id,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('operación de productos del vendedor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation((callback: (tx: object) => unknown) => callback({}));
    mocks.getCurrentAdmin.mockResolvedValue(SELLER);
    mocks.repository.createListing.mockResolvedValue(LISTING);
    mocks.repository.findListingByIdForUpdate.mockResolvedValue(LISTING);
    mocks.repository.updateListing.mockResolvedValue(LISTING);
    mocks.repository.setListingStatus.mockResolvedValue({ ...LISTING, status: 'review' });
    mocks.repository.marketWorkspace.mockResolvedValue({
      vendors: [
        { id: SELLER.vendorId, name: 'Finca Roble' },
        { id: '66666666-6666-4666-8666-666666666666', name: 'Finca Ajena' },
      ],
      listings: [
        LISTING,
        {
          ...LISTING,
          id: '77777777-7777-4777-8777-777777777777',
          vendorId: '66666666-6666-4666-8666-666666666666',
        },
      ],
    });
    mocks.findVendorByUserId.mockResolvedValue({ id: SELLER.vendorId, name: 'Finca Roble' });
  });

  it('fuerza el vendorId de la sesión al crear un borrador', async () => {
    await createVendorListing({
      vendorId: '55555555-5555-4555-8555-555555555555',
      title: LISTING.title,
      brand: LISTING.brand,
      category: LISTING.category,
      variety: LISTING.variety,
      process: LISTING.process,
      origin: LISTING.origin,
      presentation: LISTING.presentation,
      weightGrams: LISTING.weightGrams,
      inventory: LISTING.inventory,
      priceCents: LISTING.priceCents,
      delivery: LISTING.delivery,
      traceability: LISTING.traceability,
      reason: 'Borrador del vendedor',
    });

    expect(mocks.repository.createListing).toHaveBeenCalledWith(
      expect.objectContaining({ vendorId: SELLER.vendorId }),
      expect.anything(),
    );
  });

  it('impide editar una publicación de otro vendedor', async () => {
    mocks.repository.findListingByIdForUpdate.mockResolvedValue({
      ...LISTING,
      vendorId: '66666666-6666-4666-8666-666666666666',
    });

    await expect(
      updateVendorListing({
        id: LISTING.id,
        title: LISTING.title,
        brand: LISTING.brand,
        category: LISTING.category,
        variety: LISTING.variety,
        process: LISTING.process,
        origin: LISTING.origin,
        presentation: LISTING.presentation,
        weightGrams: LISTING.weightGrams,
        inventory: LISTING.inventory,
        priceCents: LISTING.priceCents,
        delivery: LISTING.delivery,
        traceability: LISTING.traceability,
        reason: 'Cambio no autorizado',
      }),
    ).rejects.toThrow('no pertenece');
    expect(mocks.repository.updateListing).not.toHaveBeenCalled();
  });

  it('limita el workspace del vendedor a su propio catálogo', async () => {
    const workspace = await getMarketWorkspace(SELLER);

    expect(workspace.vendors).toEqual([{ id: SELLER.vendorId, name: 'Finca Roble' }]);
    expect(workspace.listings).toHaveLength(1);
    expect(workspace.listings[0].vendorId).toBe(SELLER.vendorId);
  });

  it('no envía a revisión un borrador incompleto', async () => {
    mocks.repository.findListingByIdForUpdate.mockResolvedValue({ ...LISTING, variety: '' });

    await expect(
      submitVendorListingForReview({ id: LISTING.id, reason: 'Envío a moderación' }),
    ).rejects.toThrow('producto está incompleto');
    expect(mocks.repository.setListingStatus).not.toHaveBeenCalled();
  });

  it('impide publicar desde moderación un producto incompleto', async () => {
    mocks.getCurrentAdmin.mockResolvedValue(OWNER);
    mocks.repository.findListingByIdForUpdate.mockResolvedValue({
      ...LISTING,
      brand: '',
      status: 'review',
    });

    await expect(
      changeMarketListingStatus({
        id: LISTING.id,
        from: 'review',
        to: 'published',
        reason: 'Publicación de prueba',
      }),
    ).rejects.toThrow('producto está incompleto');
    expect(mocks.repository.setListingStatus).not.toHaveBeenCalled();
  });
});
