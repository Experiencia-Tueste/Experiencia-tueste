import 'server-only';

import { getDb } from '@/db/client';
import { getEngagementRepository } from '@/db/admin-engagement-repository';
import type { DbClient } from '@/db/db-types';

/**
 * `PUT`/`DELETE /api/community/consent` están autenticados pero sin límite:
 * la misma persona podría escribirlos en bucle. Reutiliza el bucket
 * atómico persistido (mismo mecanismo que `/api/engagements`) con un
 * espacio de claves propio por usuario.
 */
export const COMMUNITY_CONSENT_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  userMaxRequests: 20,
} as const;

export interface CommunityConsentRateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

function retryAfterSeconds(now: Date, windowStartedAt: Date) {
  const elapsed = now.getTime() - windowStartedAt.getTime();
  return Math.max(1, Math.ceil((COMMUNITY_CONSENT_RATE_LIMIT.windowMs - elapsed) / 1000));
}

async function checkWithTransaction(
  userId: string,
  now: Date,
  tx: DbClient,
): Promise<CommunityConsentRateLimitDecision> {
  const windowStartedAt = new Date(now.getTime() - COMMUNITY_CONSENT_RATE_LIMIT.windowMs);
  const bucket = await getEngagementRepository().incrementRateLimitBucket(
    {
      bucketKey: `community-consent:user:${userId}`,
      windowStartedAt,
      now,
      maxRequests: COMMUNITY_CONSENT_RATE_LIMIT.userMaxRequests,
    },
    tx,
  );
  if (bucket.requestCount > COMMUNITY_CONSENT_RATE_LIMIT.userMaxRequests) {
    return { allowed: false, retryAfterSeconds: retryAfterSeconds(now, bucket.windowStartedAt) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export async function checkCommunityConsentRateLimit(
  userId: string,
  now: Date = new Date(),
): Promise<CommunityConsentRateLimitDecision> {
  return getDb().transaction((tx) => checkWithTransaction(userId, now, tx));
}
