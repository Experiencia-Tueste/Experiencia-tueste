import { describe, expect, it } from 'vitest';

import {
  AUCTION_CREATE_SCHEMA,
  BACKSTAGE_PASS_CREATE_SCHEMA,
  MARKET_LISTING_CREATE_SCHEMA,
  TREE_ADOPTION_CREATE_SCHEMA,
  UNITY_OPPORTUNITY_CREATE_SCHEMA,
  assertChanged,
  canTransitionAuction,
  canTransitionBackstage,
  canTransitionMarket,
  canTransitionTree,
  canTransitionUnity,
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
        category: 'Café',
        inventory: '12',
        priceCents: '4500000',
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
});
