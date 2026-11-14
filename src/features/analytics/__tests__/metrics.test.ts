import { describe, expect, it } from 'vitest';
import { summarizeAnalytics } from '../metrics';

describe('resumen de analítica', () => {
  it('calcula embudo y salud sin leer datos personales', () => {
    const result = summarizeAnalytics(
      [
        { eventName: 'checkout_started', createdAt: new Date() },
        { eventName: 'checkout_started', createdAt: new Date() },
        { eventName: 'community_joined', createdAt: new Date() },
      ],
      [{ route: '/api/checkout', status: 500, createdAt: new Date() }],
    );

    expect(result.total).toBe(3);
    expect(result.funnel[0]).toEqual({ label: 'Checkout iniciados', value: 2 });
    expect(result.health).toEqual({
      operationalErrors: 1,
      errorGroups: [{ route: '/api/checkout', value: 1 }],
    });
  });
});
