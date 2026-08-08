import { describe, expect, it } from 'vitest';
import { canAdmin, canModerate, formatCop, SEED_METRICS, SEED_USERS } from '../index';

describe('feature admin', () => {
  it('expone métricas del mockup', () => {
    expect(SEED_METRICS.totalUsers).toBe(1284);
    expect(SEED_METRICS.pendingAuctions).toBe(2);
  });

  it('solo el admin puede ejecutar acciones de administración', () => {
    const admin = SEED_USERS.find((u) => u.role === 'admin')!;
    const mod = SEED_USERS.find((u) => u.role === 'moderator')!;
    expect(canAdmin(admin)).toBe(true);
    expect(canAdmin(mod)).toBe(false);
  });

  it('moderadores pueden moderar contenido', () => {
    const mod = SEED_USERS.find((u) => u.role === 'moderator')!;
    expect(canModerate(mod)).toBe(true);
  });

  it('formatea montos en COP', () => {
    expect(formatCop(48500000)).toContain('48.500.000');
  });
});
