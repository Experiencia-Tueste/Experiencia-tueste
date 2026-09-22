import 'server-only';

import { getDb } from '@/db/client';
import { getEngagementRepository } from '@/db/admin-engagement-repository';
import type { DbClient } from '@/db/db-types';

/**
 * `loginCustomerAction`/`registerCustomerAction` solo dependían del
 * throttle por defecto de Supabase Auth (no versionado, no visible desde
 * este repo). Reutiliza el mismo bucket atómico persistido que protege
 * `/api/engagements`, `/api/analytics` y `/api/community/consent`, con su
 * propio espacio de claves por IP + correo normalizado (lowercase/trim),
 * como sugirió la auditoría de seguridad: esto acota intentos de fuerza
 * bruta contra una cuenta puntual sin bloquear a otros usuarios detrás del
 * mismo proxy ni a la misma IP probando correos distintos legítimos.
 *
 * Login y registro tienen espacios de claves separados (`login`/`register`)
 * para que agotar uno no bloquee al otro.
 */
export const CUSTOMER_LOGIN_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  maxRequests: 10,
} as const;

export const CUSTOMER_REGISTER_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  maxRequests: 5,
} as const;

export interface CustomerAuthRateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function retryAfterSeconds(windowMs: number, now: Date, windowStartedAt: Date) {
  const elapsed = now.getTime() - windowStartedAt.getTime();
  return Math.max(1, Math.ceil((windowMs - elapsed) / 1000));
}

async function checkWithTransaction(
  bucketKey: string,
  config: { windowMs: number; maxRequests: number },
  now: Date,
  tx: DbClient,
): Promise<CustomerAuthRateLimitDecision> {
  const windowStartedAt = new Date(now.getTime() - config.windowMs);
  const bucket = await getEngagementRepository().incrementRateLimitBucket(
    { bucketKey, windowStartedAt, now, maxRequests: config.maxRequests },
    tx,
  );
  if (bucket.requestCount > config.maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: retryAfterSeconds(config.windowMs, now, bucket.windowStartedAt),
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export async function checkCustomerLoginRateLimit(
  origin: string,
  email: string,
  now: Date = new Date(),
): Promise<CustomerAuthRateLimitDecision> {
  const bucketKey = `customer-auth:login:${origin}:${normalizeEmail(email)}`;
  return getDb().transaction((tx) =>
    checkWithTransaction(bucketKey, CUSTOMER_LOGIN_RATE_LIMIT, now, tx),
  );
}

export async function checkCustomerRegisterRateLimit(
  origin: string,
  email: string,
  now: Date = new Date(),
): Promise<CustomerAuthRateLimitDecision> {
  const bucketKey = `customer-auth:register:${origin}:${normalizeEmail(email)}`;
  return getDb().transaction((tx) =>
    checkWithTransaction(bucketKey, CUSTOMER_REGISTER_RATE_LIMIT, now, tx),
  );
}
