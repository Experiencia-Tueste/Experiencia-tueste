import 'server-only';

import { getDb } from '@/db/client';
import { getEngagementRepository } from '@/db/admin-engagement-repository';
import type { DbClient } from '@/db/db-types';

export const ENGAGEMENT_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  originMaxRequests: 20,
  userMaxRequests: 8,
} as const;

export interface EngagementRateLimitSubject {
  origin: string;
  userId?: string;
  now?: Date;
}

export interface EngagementRateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

/** Identificador de origen para el proxy confiable; nunca se registra en logs. */
export function requestOrigin(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const real = request.headers.get('x-real-ip')?.trim();
  return (forwarded || real || 'unknown').slice(0, 120);
}

function retryAfterSeconds(now: Date, windowStartedAt: Date) {
  const elapsed = now.getTime() - windowStartedAt.getTime();
  return Math.max(1, Math.ceil((ENGAGEMENT_RATE_LIMIT.windowMs - elapsed) / 1000));
}

async function checkWithTransaction(
  subject: EngagementRateLimitSubject,
  tx: DbClient,
): Promise<EngagementRateLimitDecision> {
  const now = subject.now ?? new Date();
  const windowStartedAt = new Date(now.getTime() - ENGAGEMENT_RATE_LIMIT.windowMs);
  const repository = getEngagementRepository();
  const originBucket = await repository.incrementRateLimitBucket(
    {
      bucketKey: `engagement:origin:${subject.origin}`,
      windowStartedAt,
      now,
      maxRequests: ENGAGEMENT_RATE_LIMIT.originMaxRequests,
    },
    tx,
  );

  if (originBucket.requestCount > ENGAGEMENT_RATE_LIMIT.originMaxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: retryAfterSeconds(now, originBucket.windowStartedAt),
    };
  }

  if (!subject.userId) return { allowed: true, retryAfterSeconds: 0 };

  const userBucket = await repository.incrementRateLimitBucket(
    {
      bucketKey: `engagement:user:${subject.userId}`,
      windowStartedAt,
      now,
      maxRequests: ENGAGEMENT_RATE_LIMIT.userMaxRequests,
    },
    tx,
  );
  if (userBucket.requestCount > ENGAGEMENT_RATE_LIMIT.userMaxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: retryAfterSeconds(now, userBucket.windowStartedAt),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function checkEngagementRateLimit(
  subject: EngagementRateLimitSubject,
): Promise<EngagementRateLimitDecision> {
  return getDb().transaction((tx) => checkWithTransaction(subject, tx));
}
