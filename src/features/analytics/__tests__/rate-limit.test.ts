import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  incrementRateLimitBucket: vi.fn(),
}));

vi.mock('@/db/client', () => ({
  getDb: () => ({ transaction: mocks.transaction }),
}));
vi.mock('@/db/admin-engagement-repository', () => ({
  getEngagementRepository: () => ({ incrementRateLimitBucket: mocks.incrementRateLimitBucket }),
}));

import { ANALYTICS_RATE_LIMIT, checkAnalyticsRateLimit } from '../rate-limit';

describe('rate limiting de /api/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation((callback: (tx: object) => unknown) => callback({}));
  });

  it('mantiene un espacio de claves propio, separado del de engagements', () => {
    expect(ANALYTICS_RATE_LIMIT).toEqual({ windowMs: 600000, originMaxRequests: 60 });
  });

  it('permite tráfico dentro del límite usando el bucket por origen', async () => {
    mocks.incrementRateLimitBucket.mockResolvedValue({
      requestCount: 1,
      windowStartedAt: new Date(),
    });

    const result = await checkAnalyticsRateLimit('203.0.113.10');

    expect(result).toEqual({ allowed: true, retryAfterSeconds: 0 });
    expect(mocks.incrementRateLimitBucket).toHaveBeenCalledWith(
      expect.objectContaining({
        bucketKey: 'analytics:origin:203.0.113.10',
        maxRequests: 60,
      }),
      expect.anything(),
    );
  });

  it('bloquea y calcula Retry-After cuando se excede el límite por origen', async () => {
    const now = new Date('2026-09-22T12:00:00.000Z');
    const windowStartedAt = new Date('2026-09-22T11:55:00.000Z');
    mocks.incrementRateLimitBucket.mockResolvedValue({ requestCount: 61, windowStartedAt });

    const result = await checkAnalyticsRateLimit('203.0.113.10', now);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });
});
