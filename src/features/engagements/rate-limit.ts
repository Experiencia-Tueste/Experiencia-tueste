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

/**
 * Identificador de origen para el proxy confiable; nunca se registra en logs.
 *
 * Railway documenta `X-Real-IP` como el único header de IP de cliente que
 * garantiza y que el cliente no puede falsificar
 * (docs.railway.com/networking/public-networking/specs-and-limits). No hay
 * contrato documentado sobre `X-Forwarded-For`: Railway no especifica si lo
 * sobreescribe, lo agrega o lo reenvía intacto, así que no es una fuente
 * confiable de IP de cliente en este despliegue. Confirmado por Rocha contra
 * la documentación oficial (ver docs/engagement-security.md).
 *
 * Nota: si en algún momento hay más de un proxy delante del contenedor,
 * tomar un hop de `X-Forwarded-For` puede ser peor que no tener límite —
 * todo el tráfico anónimo detrás del mismo hop intermedio colapsaría en el
 * mismo valor y un solo cliente abusivo bloquearía a los demás. Por eso no
 * se usa como fuente ni siquiera como respaldo.
 *
 * Fallback: si `X-Real-IP` no está presente (por ejemplo, en desarrollo
 * local, donde no hay proxy de Railway por delante) se cae a `'unknown'`,
 * que agrupa ese tráfico en un único balde de rate limit en vez de fallar.
 */
export function requestOrigin(headers: Headers): string {
  const real = headers.get('x-real-ip')?.trim();
  return (real || 'unknown').slice(0, 120);
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
