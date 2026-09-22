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
 * `X-Forwarded-For` es una lista donde cada proxy AÑADE su propia vista del
 * cliente al final de la cadena en vez de sobrescribirla. El primer valor lo
 * puede fijar libremente quien hace la petición (spoofable); el ÚLTIMO valor
 * es el que agrega el proxy más cercano al servidor, que el cliente no puede
 * falsificar salvo que ese proxy reenvíe headers sin tocarlos.
 *
 * Supuesto asumido para este despliegue (Railway, un único proxy de borde
 * delante del contenedor — ver docs/deployment-latinoamerica-hosting.md):
 * el ÚLTIMO salto de `X-Forwarded-For` es el que agrega ese proxy y es
 * confiable; los anteriores no lo son. Esto NO está confirmado contra el
 * contrato real de la infraestructura — pendiente de verificación por Rocha.
 * Si Railway antepusiera otro balanceador delante de su proxy de borde, este
 * supuesto dejaría de ser válido y habría que ajustar el hop de confianza.
 */
export function requestOrigin(request: Request): string {
  const forwardedHeader = request.headers.get('x-forwarded-for');
  const lastHop = forwardedHeader
    ?.split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .pop();
  const real = request.headers.get('x-real-ip')?.trim();
  return (lastHop || real || 'unknown').slice(0, 120);
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
