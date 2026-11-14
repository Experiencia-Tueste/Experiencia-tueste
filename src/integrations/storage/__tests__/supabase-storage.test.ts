import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  info: vi.fn(),
  from: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createClient,
}));

import {
  buildAssetStorageKey,
  buildVendorImageStorageKey,
  SupabaseStorageProvider,
} from '../supabase-storage';

describe('supabase storage · claves de activos', () => {
  it('normaliza nombres de archivo para claves estables', () => {
    expect(
      buildAssetStorageKey(' Portada Café Final.webp ', new Date('2026-08-28T00:00:00Z')),
    ).toBe('admin-assets/2026/08/1787875200000-portada-cafe-final.webp');
  });
});

describe('supabase storage · claves de imágenes de vendedor', () => {
  const vendorId = '22222222-2222-4222-8222-222222222222';

  it('siempre queda bajo el prefijo del vendedor dado, sin importar el nombre de archivo', () => {
    const key = buildVendorImageStorageKey(
      vendorId,
      ' Café Especial Final.WEBP ',
      new Date('2026-08-28T00:00:00Z'),
    );
    expect(key.startsWith(`vendors/${vendorId}/`)).toBe(true);
    expect(key).toBe(`vendors/${vendorId}/1787875200000-cafe-especial-final.webp`);
  });

  it('produce claves distintas para vendedores distintos con el mismo archivo y timestamp', () => {
    const now = new Date('2026-08-28T00:00:00Z');
    const otherVendorId = '99999999-9999-4999-8999-999999999999';
    const keyA = buildVendorImageStorageKey(vendorId, 'producto.webp', now);
    const keyB = buildVendorImageStorageKey(otherVendorId, 'producto.webp', now);
    expect(keyA).not.toBe(keyB);
    expect(keyA.startsWith(`vendors/${vendorId}/`)).toBe(true);
    expect(keyB.startsWith(`vendors/${otherVendorId}/`)).toBe(true);
  });
});

const CONFIG = {
  supabaseUrl: 'https://project.supabase.co',
  adminKey: 'service-role-key',
  bucket: 'tueste-admin-assets',
};

describe('SupabaseStorageProvider.getObjectMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({ info: mocks.info });
    mocks.createClient.mockReturnValue({ storage: { from: mocks.from } });
  });

  function provider() {
    return new SupabaseStorageProvider(CONFIG);
  }

  it('devuelve size y contentType cuando el objeto existe', async () => {
    mocks.info.mockResolvedValue({
      data: { size: 4096, contentType: 'image/webp' },
      error: null,
    });

    const result = await provider().getObjectMetadata(
      `${CONFIG.bucket}/vendors/vendor-1/image.webp`,
    );

    expect(mocks.from).toHaveBeenCalledWith(CONFIG.bucket);
    // El prefijo del bucket se recorta del path antes de pedirle info al SDK.
    expect(mocks.info).toHaveBeenCalledWith('vendors/vendor-1/image.webp');
    expect(result).toEqual({ size: 4096, contentType: 'image/webp' });
  });

  it('no recorta nada cuando la key ya viene sin el prefijo del bucket', async () => {
    mocks.info.mockResolvedValue({
      data: { size: 10, contentType: null },
      error: null,
    });

    const result = await provider().getObjectMetadata('vendors/vendor-1/image.webp');

    expect(mocks.info).toHaveBeenCalledWith('vendors/vendor-1/image.webp');
    expect(result).toEqual({ size: 10, contentType: null });
  });

  it('devuelve null cuando el SDK responde 404 (objeto inexistente)', async () => {
    mocks.info.mockResolvedValue({
      data: null,
      error: { status: 404, message: 'Not Found' },
    });

    const result = await provider().getObjectMetadata(
      `${CONFIG.bucket}/vendors/vendor-1/missing.webp`,
    );

    expect(result).toBeNull();
  });

  it('devuelve null cuando el SDK responde 400 (bad request tratado como ausente)', async () => {
    mocks.info.mockResolvedValue({
      data: null,
      error: { status: 400, message: 'Bad Request' },
    });

    const result = await provider().getObjectMetadata(
      `${CONFIG.bucket}/vendors/vendor-1/missing.webp`,
    );

    expect(result).toBeNull();
  });

  it('relanza cualquier otro error del SDK (ej. 500) en vez de tratarlo como ausente', async () => {
    const upstreamError = { status: 500, message: 'Internal Server Error' };
    mocks.info.mockResolvedValue({ data: null, error: upstreamError });

    await expect(
      provider().getObjectMetadata(`${CONFIG.bucket}/vendors/vendor-1/image.webp`),
    ).rejects.toBe(upstreamError);
  });

  it('corta con un 503 acotado si Storage no responde a tiempo, en vez de colgar indefinidamente', async () => {
    vi.useFakeTimers();
    try {
      // El SDK nunca resuelve: simula un Storage colgado.
      mocks.info.mockReturnValue(new Promise(() => {}));

      const pending = provider().getObjectMetadata(`${CONFIG.bucket}/vendors/vendor-1/image.webp`);
      const assertion = expect(pending).rejects.toThrow(
        '503: tiempo de espera agotado al verificar la imagen en Storage.',
      );

      await vi.advanceTimersByTimeAsync(8000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});
