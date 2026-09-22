import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCurrentAdmin: vi.fn(),
  createAdminStorageProvider: vi.fn(),
}));

vi.mock('@/lib/auth/authorization', () => ({
  getCurrentAdmin: mocks.getCurrentAdmin,
}));
vi.mock('@/integrations/storage/supabase-storage', async () => {
  const actual = await vi.importActual<typeof import('@/integrations/storage/supabase-storage')>(
    '@/integrations/storage/supabase-storage',
  );
  return {
    ...actual,
    createAdminStorageProvider: mocks.createAdminStorageProvider,
  };
});

import {
  assertMarketListingImageStored,
  createVendorImageSignedUpload,
} from '../market-image-service';

const VENDOR_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_VENDOR_ID = '99999999-9999-4999-8999-999999999999';

const SELLER = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'seller@example.com',
  name: 'Seller',
  role: 'vendedor' as const,
  vendorId: VENDOR_ID,
  capabilities: ['admin.access', 'market.read', 'market.self'] as never,
};

describe('createVendorImageSignedUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('usa el vendorId de la sesión, ignorando cualquier vendorId del input', async () => {
    mocks.getCurrentAdmin.mockResolvedValue(SELLER);
    const createSignedUpload = vi.fn().mockResolvedValue({
      bucket: 'tueste-admin-assets',
      path: 'ignored-by-test',
      token: 'token-abc',
      storageKey: 'tueste-admin-assets/ignored-by-test',
    });
    mocks.createAdminStorageProvider.mockReturnValue({ createSignedUpload });

    const result = await createVendorImageSignedUpload({
      // Un input hostil que intenta apuntar al prefijo de otro vendedor.
      vendorId: OTHER_VENDOR_ID,
      filename: 'producto.webp',
      mimeType: 'image/webp',
      sizeBytes: 1000,
    });

    expect(createSignedUpload).toHaveBeenCalledTimes(1);
    const [{ key }] = createSignedUpload.mock.calls[0];
    expect(key.startsWith(`vendors/${VENDOR_ID}/`)).toBe(true);
    expect(key).not.toContain(OTHER_VENDOR_ID);
    expect(result.imagePath.startsWith(`vendors/${VENDOR_ID}/`)).toBe(true);
  });

  it('rechaza sin sesión administrativa', async () => {
    mocks.getCurrentAdmin.mockResolvedValue(null);

    await expect(
      createVendorImageSignedUpload({
        filename: 'producto.webp',
        mimeType: 'image/webp',
        sizeBytes: 1000,
      }),
    ).rejects.toThrow('401');
  });

  it('rechaza sin la capacidad market.self', async () => {
    mocks.getCurrentAdmin.mockResolvedValue({ ...SELLER, capabilities: ['admin.access'] });

    await expect(
      createVendorImageSignedUpload({
        filename: 'producto.webp',
        mimeType: 'image/webp',
        sizeBytes: 1000,
      }),
    ).rejects.toThrow('403');
  });

  it('rechaza cuentas de vendedor sin vendorId vinculado', async () => {
    mocks.getCurrentAdmin.mockResolvedValue({ ...SELLER, vendorId: undefined });

    await expect(
      createVendorImageSignedUpload({
        filename: 'producto.webp',
        mimeType: 'image/webp',
        sizeBytes: 1000,
      }),
    ).rejects.toThrow('403');
  });

  it('rechaza extensiones y content-types no permitidos', async () => {
    mocks.getCurrentAdmin.mockResolvedValue(SELLER);

    await expect(
      createVendorImageSignedUpload({
        filename: 'producto.gif',
        mimeType: 'image/gif',
        sizeBytes: 1000,
      }),
    ).rejects.toThrow();
  });

  it('rechaza si Storage no está configurado', async () => {
    mocks.getCurrentAdmin.mockResolvedValue(SELLER);
    mocks.createAdminStorageProvider.mockReturnValue(null);

    await expect(
      createVendorImageSignedUpload({
        filename: 'producto.webp',
        mimeType: 'image/webp',
        sizeBytes: 1000,
      }),
    ).rejects.toThrow('503');
  });
});

describe('assertMarketListingImageStored', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no verifica nada si el listing no declaró imagen', async () => {
    await expect(
      assertMarketListingImageStored({ imagePath: null, imageSizeBytes: 0 }),
    ).resolves.toBeUndefined();
    expect(mocks.createAdminStorageProvider).not.toHaveBeenCalled();
  });

  it('lanza 503 si Storage no está disponible para verificar', async () => {
    mocks.createAdminStorageProvider.mockReturnValue(null);

    await expect(
      assertMarketListingImageStored({
        imagePath: `vendors/${VENDOR_ID}/foto.webp`,
        imageSizeBytes: 1000,
      }),
    ).rejects.toThrow('503');
  });

  it('lanza 400 si el objeto declarado no existe realmente en Storage', async () => {
    const getObjectMetadata = vi.fn().mockResolvedValue(null);
    mocks.createAdminStorageProvider.mockReturnValue({ getObjectMetadata });

    await expect(
      assertMarketListingImageStored({
        imagePath: `vendors/${VENDOR_ID}/foto.webp`,
        imageSizeBytes: 1000,
      }),
    ).rejects.toThrow('no existe');
  });

  it('lanza 400 si el tamaño real no coincide con el declarado', async () => {
    const getObjectMetadata = vi.fn().mockResolvedValue({ size: 500, contentType: 'image/webp' });
    mocks.createAdminStorageProvider.mockReturnValue({ getObjectMetadata });

    await expect(
      assertMarketListingImageStored({
        imagePath: `vendors/${VENDOR_ID}/foto.webp`,
        imageSizeBytes: 1000,
      }),
    ).rejects.toThrow('tamaño');
  });

  it('lanza 400 si el content-type real no coincide con la extensión declarada', async () => {
    const getObjectMetadata = vi
      .fn()
      .mockResolvedValue({ size: 1000, contentType: 'application/pdf' });
    mocks.createAdminStorageProvider.mockReturnValue({ getObjectMetadata });

    await expect(
      assertMarketListingImageStored({
        imagePath: `vendors/${VENDOR_ID}/foto.webp`,
        imageSizeBytes: 1000,
      }),
    ).rejects.toThrow('tipo de archivo');
  });

  it('no lanza cuando existencia, tamaño y content-type reales coinciden', async () => {
    const getObjectMetadata = vi.fn().mockResolvedValue({ size: 1000, contentType: 'image/webp' });
    mocks.createAdminStorageProvider.mockReturnValue({ getObjectMetadata });

    await expect(
      assertMarketListingImageStored({
        imagePath: `vendors/${VENDOR_ID}/foto.webp`,
        imageSizeBytes: 1000,
      }),
    ).resolves.toBeUndefined();
    expect(getObjectMetadata).toHaveBeenCalledWith(`vendors/${VENDOR_ID}/foto.webp`);
  });
});
