import { describe, expect, it } from 'vitest';

import {
  AUCTION_CREATE_SCHEMA,
  BACKSTAGE_PASS_CREATE_SCHEMA,
  MARKET_IMAGE_MAX_BYTES,
  MARKET_LISTING_CREATE_SCHEMA,
  TREE_ADOPTION_CREATE_SCHEMA,
  UNITY_OPPORTUNITY_CREATE_SCHEMA,
  assertChanged,
  assertMarketListingComplete,
  canTransitionAuction,
  canTransitionBackstage,
  canTransitionMarket,
  canTransitionTree,
  canTransitionUnity,
  validateMarketImage,
} from '../operations-schemas';

const id = '0e824480-7b6f-4a30-8c4a-2141291fa8a1';

describe('admin operations schemas', () => {
  it('normaliza adopciones y publicaciones', () => {
    expect(
      TREE_ADOPTION_CREATE_SCHEMA.parse({
        lotId: id,
        adopterName: '  Ana Tueste ',
        adopterEmail: ' ANA@EXAMPLE.COM ',
        treesCount: '3',
        certificateCode: ' TREE-003 ',
        reason: 'Alta confirmada',
      }),
    ).toMatchObject({ adopterName: 'Ana Tueste', adopterEmail: 'ana@example.com', treesCount: 3 });

    expect(
      MARKET_LISTING_CREATE_SCHEMA.parse({
        vendorId: id,
        title: 'Café de origen',
        brand: 'Finca Roble',
        category: 'Café',
        variety: 'Castillo',
        process: 'Lavado',
        origin: 'Quindío',
        presentation: 'Bolsa de 340 g',
        weightGrams: '340',
        inventory: '12',
        priceCents: '4500000',
        delivery: 'Envío nacional en 3 días',
        traceability: 'Lote QR-001 · Finca Roble',
        reason: 'Catálogo inicial',
      }).inventory,
    ).toBe(12);
  });

  it('valida fechas y datos comerciales', () => {
    expect(
      UNITY_OPPORTUNITY_CREATE_SCHEMA.parse({
        organization: 'Casa Origen',
        contactName: 'Lina',
        contactEmail: 'lina@example.com',
        service: 'Curaduría sonora',
        estimatedValueCents: '',
        reason: 'Lead recibido',
      }).estimatedValueCents,
    ).toBeUndefined();

    expect(() =>
      AUCTION_CREATE_SCHEMA.parse({
        title: 'Lote especial',
        startsAt: '2026-09-03T12:00:00Z',
        endsAt: '2026-09-03T11:00:00Z',
        reserveCents: 100,
        reason: 'Preparación',
      }),
    ).toThrow();

    expect(() =>
      BACKSTAGE_PASS_CREATE_SCHEMA.parse({
        holderName: 'Ana',
        holderEmail: 'ana@example.com',
        zone: 'Prensa',
        startsAt: '2026-09-03T12:00:00Z',
        endsAt: '2026-09-03T11:00:00Z',
        reason: 'Cobertura',
      }),
    ).toThrow();
  });

  it('protege transiciones de subasta y cambios vacíos', () => {
    expect(canTransitionAuction('draft', 'approved')).toBe(true);
    expect(canTransitionAuction('draft', 'open')).toBe(false);
    expect(canTransitionTree('pending', 'active')).toBe(true);
    expect(canTransitionMarket('draft', 'published')).toBe(false);
    expect(canTransitionUnity('proposal', 'won')).toBe(true);
    expect(canTransitionBackstage('issued', 'revoked')).toBe(true);
    expect(() => assertChanged('active', 'active')).toThrow('estado no cambió');
  });

  it('bloquea productos incompletos y rutas de imagen ajenas', () => {
    const complete = {
      vendorId: id,
      title: 'Café de origen',
      brand: 'Finca Roble',
      category: 'Café tostado',
      variety: 'Castillo',
      process: 'Lavado',
      origin: 'Quindío',
      presentation: 'Bolsa de 340 g',
      weightGrams: 340,
      inventory: 12,
      priceCents: 4500000,
      delivery: 'Envío nacional en 3 días',
      traceability: 'Lote QR-001 · Finca Roble',
    };
    expect(() => assertMarketListingComplete(complete)).not.toThrow();
    expect(() => assertMarketListingComplete({ ...complete, variety: '' })).toThrow(
      'producto está incompleto',
    );
    expect(() =>
      validateMarketImage({
        vendorId: id,
        imagePath: `vendors/otro/${id}.png`,
        imageSizeBytes: 1000,
      }),
    ).toThrow('no pertenece');
    expect(() =>
      validateMarketImage({
        vendorId: id,
        imagePath: `vendors/${id}/producto.gif`,
        imageSizeBytes: 1000,
      }),
    ).toThrow('JPG, PNG o WebP');
    expect(() =>
      validateMarketImage({
        vendorId: id,
        imagePath: `vendors/${id}/producto.webp`,
        imageSizeBytes: MARKET_IMAGE_MAX_BYTES + 1,
      }),
    ).toThrow('pesar');
  });
});
