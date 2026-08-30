import { describe, expect, it } from 'vitest';
import { FARM_LOT_SCHEMA, expiryState } from '../compliance-schemas';

describe('cumplimiento y finca', () => {
  it('normaliza código y peso del lote', () => {
    const lot = FARM_LOT_SCHEMA.parse({
      farmId: '11111111-1111-4111-8111-111111111111',
      code: ' lote-01 ',
      harvestYear: '2026',
      variety: 'Caturra',
      process: 'Lavado',
      weightKg: '42.5',
      reason: 'Registro inicial',
    });
    expect(lot.code).toBe('LOTE-01');
    expect(lot.weightKg).toBe(42.5);
  });
  it('calcula alertas sin depender del render', () => {
    const now = new Date('2026-08-30T00:00:00Z');
    expect(expiryState('2026-08-29T00:00:00Z', now)).toBe('vencido');
    expect(expiryState('2026-09-10T00:00:00Z', now)).toBe('por-vencer');
    expect(expiryState('2027-01-01T00:00:00Z', now)).toBe('vigente');
    expect(expiryState(null, now)).toBe('sin-vencimiento');
  });
});
