import { describe, expect, it } from 'vitest';
import { effectiveTier, PLANS, visiblePerks } from '../index';

describe('feature membership', () => {
  it('expone los planes del mockup', () => {
    expect(PLANS.map((p) => p.name)).toEqual(['Cántara', 'Resonancia']);
    expect(PLANS[1].highlighted).toBe(true);
  });

  it('una membresía inactiva se trata como free', () => {
    expect(effectiveTier({ tier: 'resonancia', active: false })).toBe('free');
    expect(effectiveTier({ tier: 'resonancia', active: true })).toBe('resonancia');
  });

  it('muestra beneficios según el nivel', () => {
    expect(visiblePerks('free')).toContain('Foro de comunidad');
    expect(visiblePerks('canon')).toContain('Envío gratis en la tienda');
    expect(visiblePerks('resonancia')).toContain('Invitación a Casa Cántara');
  });
});
