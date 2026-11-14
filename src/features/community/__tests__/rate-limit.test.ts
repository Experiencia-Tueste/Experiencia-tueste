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

import { COMMUNITY_CONSENT_RATE_LIMIT, checkCommunityConsentRateLimit } from '../rate-limit';

describe('rate limiting de /api/community/consent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation((callback: (tx: object) => unknown) => callback({}));
  });

  it('mantiene un espacio de claves propio por usuario', () => {
    expect(COMMUNITY_CONSENT_RATE_LIMIT).toEqual({ windowMs: 600000, userMaxRequests: 20 });
  });

  it('permite tráfico dentro del límite', async () => {
    mocks.incrementRateLimitBucket.mockResolvedValue({
      requestCount: 1,
      windowStartedAt: new Date(),
    });

    const result = await checkCommunityConsentRateLimit('11111111-1111-4111-8111-111111111111');

    expect(result).toEqual({ allowed: true, retryAfterSeconds: 0 });
    expect(mocks.incrementRateLimitBucket).toHaveBeenCalledWith(
      expect.objectContaining({
        bucketKey: 'community-consent:user:11111111-1111-4111-8111-111111111111',
        maxRequests: 20,
      }),
      expect.anything(),
    );
  });

  it('bloquea y calcula Retry-After cuando se excede el límite', async () => {
    const now = new Date('2026-09-22T12:00:00.000Z');
    const windowStartedAt = new Date('2026-09-22T11:55:00.000Z');
    mocks.incrementRateLimitBucket.mockResolvedValue({ requestCount: 21, windowStartedAt });

    const result = await checkCommunityConsentRateLimit(
      '11111111-1111-4111-8111-111111111111',
      now,
    );

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });
});
