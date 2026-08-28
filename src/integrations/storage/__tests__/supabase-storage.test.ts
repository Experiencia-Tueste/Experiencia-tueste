import { describe, expect, it } from 'vitest';

import { buildAssetStorageKey } from '../supabase-storage';

describe('supabase storage · claves de activos', () => {
  it('normaliza nombres de archivo para claves estables', () => {
    expect(
      buildAssetStorageKey(' Portada Café Final.webp ', new Date('2026-08-28T00:00:00Z')),
    ).toBe('admin-assets/2026/08/1787875200000-portada-cafe-final.webp');
  });
});
