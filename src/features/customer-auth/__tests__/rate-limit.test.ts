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

import {
  CUSTOMER_LOGIN_RATE_LIMIT,
  CUSTOMER_REGISTER_RATE_LIMIT,
  checkCustomerLoginRateLimit,
  checkCustomerRegisterRateLimit,
} from '../rate-limit';

describe('rate limiting de login/registro de clientes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation((callback: (tx: object) => unknown) => callback({}));
  });

  it('mantiene límites explícitos, más estrictos para registro que para login', () => {
    expect(CUSTOMER_LOGIN_RATE_LIMIT).toEqual({ windowMs: 600000, maxRequests: 10 });
    expect(CUSTOMER_REGISTER_RATE_LIMIT).toEqual({ windowMs: 600000, maxRequests: 5 });
  });

  it('usa un espacio de claves por IP + correo normalizado (lowercase/trim)', async () => {
    mocks.incrementRateLimitBucket.mockResolvedValue({
      requestCount: 1,
      windowStartedAt: new Date(),
    });

    const result = await checkCustomerLoginRateLimit('203.0.113.10', '  Cliente@Ejemplo.com  ');

    expect(result).toEqual({ allowed: true, retryAfterSeconds: 0 });
    expect(mocks.incrementRateLimitBucket).toHaveBeenCalledWith(
      expect.objectContaining({
        bucketKey: 'customer-auth:login:203.0.113.10:cliente@ejemplo.com',
        maxRequests: 10,
      }),
      expect.anything(),
    );
  });

  it('separa el bucket de login del de registro para el mismo origen y correo', async () => {
    mocks.incrementRateLimitBucket.mockResolvedValue({
      requestCount: 1,
      windowStartedAt: new Date(),
    });

    await checkCustomerLoginRateLimit('203.0.113.10', 'cliente@ejemplo.com');
    await checkCustomerRegisterRateLimit('203.0.113.10', 'cliente@ejemplo.com');

    const keys = mocks.incrementRateLimitBucket.mock.calls.map(
      (call) => (call[0] as { bucketKey: string }).bucketKey,
    );
    expect(keys).toEqual([
      'customer-auth:login:203.0.113.10:cliente@ejemplo.com',
      'customer-auth:register:203.0.113.10:cliente@ejemplo.com',
    ]);
  });

  it('no comparte el balde entre dos IPs distintas que prueban el mismo correo', async () => {
    mocks.incrementRateLimitBucket.mockResolvedValue({
      requestCount: 1,
      windowStartedAt: new Date(),
    });

    await checkCustomerLoginRateLimit('203.0.113.10', 'cliente@ejemplo.com');
    await checkCustomerLoginRateLimit('198.51.100.7', 'cliente@ejemplo.com');

    const keys = mocks.incrementRateLimitBucket.mock.calls.map(
      (call) => (call[0] as { bucketKey: string }).bucketKey,
    );
    expect(new Set(keys).size).toBe(2);
    expect(keys).toEqual([
      'customer-auth:login:203.0.113.10:cliente@ejemplo.com',
      'customer-auth:login:198.51.100.7:cliente@ejemplo.com',
    ]);
  });

  it('no comparte el balde entre dos correos distintos probados desde la misma IP', async () => {
    mocks.incrementRateLimitBucket.mockResolvedValue({
      requestCount: 1,
      windowStartedAt: new Date(),
    });

    await checkCustomerLoginRateLimit('203.0.113.10', 'victima@ejemplo.com');
    await checkCustomerLoginRateLimit('203.0.113.10', 'otro@ejemplo.com');

    const keys = mocks.incrementRateLimitBucket.mock.calls.map(
      (call) => (call[0] as { bucketKey: string }).bucketKey,
    );
    expect(new Set(keys).size).toBe(2);
  });

  it('bloquea y calcula Retry-After cuando se excede el límite de intentos de login', async () => {
    const now = new Date('2026-09-22T12:00:00.000Z');
    const windowStartedAt = new Date('2026-09-22T11:55:00.000Z');
    mocks.incrementRateLimitBucket.mockResolvedValue({ requestCount: 11, windowStartedAt });

    const result = await checkCustomerLoginRateLimit('203.0.113.10', 'cliente@ejemplo.com', now);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('bloquea tras exceder el límite, más estricto, de intentos de registro', async () => {
    const now = new Date('2026-09-22T12:00:00.000Z');
    const windowStartedAt = new Date('2026-09-22T11:55:00.000Z');
    mocks.incrementRateLimitBucket.mockResolvedValue({ requestCount: 6, windowStartedAt });

    const result = await checkCustomerRegisterRateLimit('203.0.113.10', 'cliente@ejemplo.com', now);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('vuelve a permitir intentos una vez que el balde atómico reinicia la ventana', async () => {
    const blockedNow = new Date('2026-09-22T12:00:00.000Z');
    const staleWindowStartedAt = new Date('2026-09-22T11:55:00.000Z');
    mocks.incrementRateLimitBucket.mockResolvedValueOnce({
      requestCount: 11,
      windowStartedAt: staleWindowStartedAt,
    });
    const blocked = await checkCustomerLoginRateLimit(
      '203.0.113.10',
      'cliente@ejemplo.com',
      blockedNow,
    );
    expect(blocked.allowed).toBe(false);

    // Pasan más de 10 minutos: el mismo balde (`onConflictDoUpdate` con CASE
    // por ventana vencida, ver `incrementRateLimitBucket`) reinicia el conteo
    // a 1 y desplaza `windowStartedAt` al momento de esta nueva solicitud.
    const nextAttemptAt = new Date(blockedNow.getTime() + 11 * 60 * 1000);
    mocks.incrementRateLimitBucket.mockResolvedValueOnce({
      requestCount: 1,
      windowStartedAt: nextAttemptAt,
    });
    const allowedAgain = await checkCustomerLoginRateLimit(
      '203.0.113.10',
      'cliente@ejemplo.com',
      nextAttemptAt,
    );
    expect(allowedAgain).toEqual({ allowed: true, retryAfterSeconds: 0 });
  });
});
