import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listPublished: vi.fn(),
  findPublishedById: vi.fn(),
  getSignedUrl: vi.fn(),
}));

vi.mock('@/db/public-market-repository', () => ({
  getPublicMarketRepository: () => ({
    listPublished: mocks.listPublished,
    findPublishedById: mocks.findPublishedById,
  }),
}));
vi.mock('@/integrations/storage/supabase-storage', () => ({
  createAdminStorageProvider: () => ({ getSignedUrl: mocks.getSignedUrl }),
}));

import { findPublicMarketListing, getPublicMarketCatalog } from '../public-service';

const RECORD = {
  id: 'a1ff2bc8-f6f6-4d9f-add5-003dc7be6d7e',
  title: 'Café E2E',
  vendorId: '23e05263-d8d5-42fb-a8cc-e42a1ceb335a',
  vendorName: 'Finca Roble',
  brand: 'Marca Roble',
  category: 'Café tostado',
  variety: 'Castillo',
  process: 'Lavado',
  origin: 'Quindío',
  presentation: 'Bolsa 340 g',
  weightGrams: 340,
  inventory: 4,
  priceCents: 4800000,
  imagePath: 'vendors/23e05263-d8d5-42fb-a8cc-e42a1ceb335a/cafe.webp',
  delivery: 'Envío nacional',
  traceability: 'Lote 001',
  updatedAt: new Date(),
};

describe('proyección pública del mercado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listPublished.mockResolvedValue([RECORD]);
    mocks.findPublishedById.mockResolvedValue(RECORD);
    mocks.getSignedUrl.mockResolvedValue('https://storage.example/cafe.webp');
  });

  it('mapea el producto publicable y firma la imagen sin exponer la ruta interna', async () => {
    const [listing] = await getPublicMarketCatalog();

    expect(listing).toMatchObject({
      id: RECORD.id,
      slug: 'cafe-e2e-a1ff2bc8',
      vendorName: RECORD.vendorName,
      imageUrl: 'https://storage.example/cafe.webp',
    });
    expect(listing).not.toHaveProperty('imagePath');
  });

  it('conserva la misma proyección para el detalle reproducible', async () => {
    await expect(findPublicMarketListing(RECORD.id)).resolves.toMatchObject({
      id: RECORD.id,
      title: RECORD.title,
      priceCents: RECORD.priceCents,
    });
    expect(mocks.findPublishedById).toHaveBeenCalledWith(RECORD.id);
  });
});
