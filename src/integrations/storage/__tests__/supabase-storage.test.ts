import { describe, expect, it } from 'vitest';

import { buildAssetStorageKey, buildVendorImageStorageKey } from '../supabase-storage';

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
