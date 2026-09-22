import 'server-only';

import { getDb } from '@/db/client';
import { getEngagementRepository } from '@/db/admin-engagement-repository';
import type { DbClient } from '@/db/db-types';

/**
 * `POST /api/analytics` es público y sin autenticación: cualquier cliente
 * puede llamarlo. Reutiliza el mismo bucket atómico persistido
 * (`private.request_rate_limit_buckets`) que protege `/api/engagements`,
 * pero con su propio espacio de claves (`analytics:origin:*`) y su propio
 * límite: la telemetría de producto (aperturas de carrito, reproducciones,
 * etc.) es mucho más frecuente que una solicitud de CRM, así que compartir
 * el bucket de engagements agotaría el cupo legítimo de ese endpoint.
 */
export const ANALYTICS_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  originMaxRequests: 60,
} as const;

export interface AnalyticsRateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

function retryAfterSeconds(now: Date, windowStartedAt: Date) {
  const elapsed = now.getTime() - windowStartedAt.getTime();
  return Math.max(1, Math.ceil((ANALYTICS_RATE_LIMIT.windowMs - elapsed) / 1000));
}

async function checkWithTransaction(
  origin: string,
  now: Date,
  tx: DbClient,
): Promise<AnalyticsRateLimitDecision> {
  const windowStartedAt = new Date(now.getTime() - ANALYTICS_RATE_LIMIT.windowMs);
  const bucket = await getEngagementRepository().incrementRateLimitBucket(
    {
      bucketKey: `analytics:origin:${origin}`,
      windowStartedAt,
      now,
      maxRequests: ANALYTICS_RATE_LIMIT.originMaxRequests,
    },
    tx,
  );
  if (bucket.requestCount > ANALYTICS_RATE_LIMIT.originMaxRequests) {
    return { allowed: false, retryAfterSeconds: retryAfterSeconds(now, bucket.windowStartedAt) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export async function checkAnalyticsRateLimit(
  origin: string,
  now: Date = new Date(),
): Promise<AnalyticsRateLimitDecision> {
  return getDb().transaction((tx) => checkWithTransaction(origin, now, tx));
}
