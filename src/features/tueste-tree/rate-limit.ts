import 'server-only';

import { getDb } from '@/db/client';
import { getEngagementRepository } from '@/db/admin-engagement-repository';

/**
 * `POST /api/tree/adoption` está autenticado, pero la misma persona podría
 * llamarlo en bucle. Reutiliza el bucket atómico persistido (el mismo de
 * `/api/engagements` y del consentimiento de comunidad) con claves propias.
 */
export const TREE_ADOPTION_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  userMaxRequests: 20,
} as const;

export interface TreeAdoptionRateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

export async function checkTreeAdoptionRateLimit(
  userId: string,
  now: Date = new Date(),
): Promise<TreeAdoptionRateLimitDecision> {
  return getDb().transaction(async (tx) => {
    const windowStartedAt = new Date(now.getTime() - TREE_ADOPTION_RATE_LIMIT.windowMs);
    const bucket = await getEngagementRepository().incrementRateLimitBucket(
      {
        bucketKey: `tree-adoption:user:${userId}`,
        windowStartedAt,
        now,
        maxRequests: TREE_ADOPTION_RATE_LIMIT.userMaxRequests,
      },
      tx,
    );
    if (bucket.requestCount > TREE_ADOPTION_RATE_LIMIT.userMaxRequests) {
      const elapsed = now.getTime() - bucket.windowStartedAt.getTime();
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((TREE_ADOPTION_RATE_LIMIT.windowMs - elapsed) / 1000),
        ),
      };
    }
    return { allowed: true, retryAfterSeconds: 0 };
  });
}
