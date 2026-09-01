import 'server-only';

import { z } from 'zod';

const serviceUrlSchema = z
  .string()
  .url()
  .refine(
    (value) =>
      value.startsWith('https://') ||
      value.startsWith('http://localhost') ||
      value.includes('.railway.internal'),
    'debe usar HTTPS o una direccion privada/local autorizada',
  );

export interface PaymentsServiceConfig {
  serviceUrl: string;
  privateKeyPem: string;
  keyId: string;
  issuer: string;
  audience: string;
  timeoutMs: number;
}

function normalizePem(value: string) {
  return value.replace(/\\n/g, '\n').trim();
}

/**
 * Configuracion privada del enlace Next.js -> Spring Boot.
 * Todas ausentes desactivan checkout; una configuracion parcial falla claro.
 */
export function loadPaymentsServiceConfig(
  env: Record<string, string | undefined> = process.env,
): PaymentsServiceConfig | null {
  const serviceUrl = env.PAYMENTS_SERVICE_URL?.trim();
  const privateKey = env.PAYMENTS_JWT_PRIVATE_KEY?.trim();
  const present = [serviceUrl, privateKey].map(Boolean);

  if (present.every((value) => !value)) return null;
  if (!present.every(Boolean)) {
    throw new Error(
      'Configuracion de pagos incompleta: define PAYMENTS_SERVICE_URL y PAYMENTS_JWT_PRIVATE_KEY.',
    );
  }

  const parsedUrl = serviceUrlSchema.safeParse(serviceUrl);
  if (!parsedUrl.success) {
    throw new Error(`PAYMENTS_SERVICE_URL ${parsedUrl.error.issues[0]?.message ?? 'es invalida'}.`);
  }

  const normalizedKey = normalizePem(privateKey as string);
  if (!normalizedKey.includes('BEGIN PRIVATE KEY')) {
    throw new Error('PAYMENTS_JWT_PRIVATE_KEY debe ser una clave privada PKCS#8 en formato PEM.');
  }

  const timeoutMs = Number(env.PAYMENTS_REQUEST_TIMEOUT_MS ?? '12000');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 30000) {
    throw new Error('PAYMENTS_REQUEST_TIMEOUT_MS debe ser un entero entre 1000 y 30000.');
  }

  return {
    serviceUrl: parsedUrl.data.replace(/\/$/, ''),
    privateKeyPem: normalizedKey,
    keyId: env.PAYMENTS_JWT_KEY_ID?.trim() || 'tueste-web-1',
    issuer: env.PAYMENTS_JWT_ISSUER?.trim() || 'tueste-web',
    audience: env.PAYMENTS_JWT_AUDIENCE?.trim() || 'tueste-payments',
    timeoutMs,
  };
}
