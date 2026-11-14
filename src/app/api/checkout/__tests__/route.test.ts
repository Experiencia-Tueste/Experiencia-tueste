import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loadCheckoutConfig: vi.fn(),
  loadPaymentsServiceConfig: vi.fn(),
  createServerSupabase: vi.fn(),
}));

vi.mock('@/lib/config/env-server', () => ({
  loadCheckoutConfig: mocks.loadCheckoutConfig,
}));
vi.mock('@/lib/config/payments-env', () => ({
  loadPaymentsServiceConfig: mocks.loadPaymentsServiceConfig,
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: mocks.createServerSupabase,
}));
vi.mock('@/db/payment-repository', () => ({ createOrGetCheckoutOrder: vi.fn() }));
vi.mock('@/lib/payments/payment-service-client', () => ({
  createPaymentCheckout: vi.fn(),
  PaymentServiceError: class PaymentServiceError extends Error {},
}));
vi.mock('@/features/analytics/service', () => ({ recordOperationalError: vi.fn() }));

import { POST } from '../route';

function checkoutRequest(): Request {
  return new Request('http://localhost:3000/api/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
}

describe('POST /api/checkout', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('responde 503 y no 500 cuando la configuración del checkout es inválida', async () => {
    mocks.loadCheckoutConfig.mockImplementation(() => {
      throw new Error('SHOPIFY_STORE_URL no es una URL absoluta https:// válida');
    });

    const response = await POST(checkoutRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      message: 'El checkout no está habilitado para este canal.',
    });
    expect(mocks.createServerSupabase).not.toHaveBeenCalled();
  });

  it('no filtra el detalle de la configuración inválida al log', async () => {
    mocks.loadCheckoutConfig.mockImplementation(() => {
      throw new Error('valor-sensible-de-entorno');
    });

    await POST(checkoutRequest());

    expect(JSON.stringify(consoleError.mock.calls)).not.toContain('valor-sensible-de-entorno');
  });

  it('responde 503 cuando el canal no es mercadopago_legacy', async () => {
    mocks.loadCheckoutConfig.mockReturnValue({ mode: 'disabled', storeUrl: null });

    const response = await POST(checkoutRequest());

    expect(response.status).toBe(503);
  });

  it('exige sesión cuando el canal está habilitado', async () => {
    mocks.loadCheckoutConfig.mockReturnValue({ mode: 'mercadopago_legacy', storeUrl: null });
    mocks.loadPaymentsServiceConfig.mockReturnValue({ serviceUrl: 'https://pagos.test' });
    mocks.createServerSupabase.mockResolvedValue(null);

    const response = await POST(checkoutRequest());

    expect(response.status).toBe(401);
  });
});
