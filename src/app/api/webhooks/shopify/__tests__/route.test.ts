import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  handleShopifyDelivery: vi.fn(),
  loadShopifyWebhookSecret: vi.fn(),
  recordOperationalError: vi.fn(),
}));

vi.mock('@/features/tueste-tree/shopify-webhook-service', () => ({
  handleShopifyDelivery: mocks.handleShopifyDelivery,
}));
vi.mock('@/lib/config/env-server', () => ({
  loadShopifyWebhookSecret: mocks.loadShopifyWebhookSecret,
}));
vi.mock('@/features/analytics/service', () => ({
  recordOperationalError: mocks.recordOperationalError,
}));

import { POST } from '../route';

const SECRET = 'secreto-de-prueba';
const BODY = '{"admin_graphql_api_id":"gid://shopify/Order/1"}';
const sign = (body: string, secret = SECRET) =>
  createHmac('sha256', secret).update(body, 'utf8').digest('base64');

function delivery(options: { body?: string; headers?: Record<string, string | null> } = {}) {
  const body = options.body ?? BODY;
  const headers = new Headers({
    'content-type': 'application/json',
    'x-shopify-hmac-sha256': sign(body),
    'x-shopify-webhook-id': 'entrega-1',
    'x-shopify-topic': 'orders/paid',
  });
  for (const [name, value] of Object.entries(options.headers ?? {})) {
    if (value === null) headers.delete(name);
    else headers.set(name, value);
  }
  return new Request('http://localhost/api/webhooks/shopify', { method: 'POST', headers, body });
}

describe('POST /api/webhooks/shopify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadShopifyWebhookSecret.mockReturnValue(SECRET);
    mocks.handleShopifyDelivery.mockResolvedValue('activated');
    mocks.recordOperationalError.mockResolvedValue(undefined);
  });

  it('sin secreto configurado la ruta queda cerrada (503)', async () => {
    mocks.loadShopifyWebhookSecret.mockReturnValue(null);

    expect((await POST(delivery())).status).toBe(503);
    expect(mocks.handleShopifyDelivery).not.toHaveBeenCalled();
  });

  it('rechaza con 401 una firma ausente, de otro secreto o de otro cuerpo', async () => {
    const cases = [
      delivery({ headers: { 'x-shopify-hmac-sha256': null } }),
      delivery({ headers: { 'x-shopify-hmac-sha256': sign(BODY, 'otro-secreto') } }),
      delivery({ headers: { 'x-shopify-hmac-sha256': sign('{"otro":"cuerpo"}') } }),
    ];
    for (const request of cases) {
      expect((await POST(request)).status).toBe(401);
    }
    expect(mocks.handleShopifyDelivery).not.toHaveBeenCalled();
  });

  it('con firma válida pasa el cuerpo crudo, el tema y la entrega al servicio', async () => {
    const response = await POST(delivery());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ outcome: 'activated' });
    expect(mocks.handleShopifyDelivery).toHaveBeenCalledWith({
      deliveryId: 'entrega-1',
      topic: 'orders/paid',
      rawBody: BODY,
    });
  });

  it('exige el identificador de entrega y el tema', async () => {
    expect((await POST(delivery({ headers: { 'x-shopify-webhook-id': null } }))).status).toBe(400);
    expect((await POST(delivery({ headers: { 'x-shopify-topic': null } }))).status).toBe(400);
    expect(mocks.handleShopifyDelivery).not.toHaveBeenCalled();
  });

  it.each(['duplicate', 'ignored', 'cancelled', 'reduced'])(
    'responde 200 cuando el resultado es %s',
    async (outcome) => {
      mocks.handleShopifyDelivery.mockResolvedValue(outcome);

      const response = await POST(delivery());

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ outcome });
    },
  );

  it('un aviso no emparejado responde 200 pero queda registrado para revisión', async () => {
    mocks.handleShopifyDelivery.mockResolvedValue('unmatched');

    expect((await POST(delivery())).status).toBe(200);
    expect(mocks.recordOperationalError).toHaveBeenCalledWith(
      expect.objectContaining({ route: '/api/webhooks/shopify', errorCode: 'adoption_unmatched' }),
    );
  });

  it('si aplicar el efecto falla responde 500 sin detalle, para que Shopify reintente', async () => {
    mocks.handleShopifyDelivery.mockRejectedValue(new Error('detalle interno de postgres'));

    const response = await POST(delivery());

    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain('postgres');
  });

  it('rechaza cuerpos enormes antes de verificar nada', async () => {
    const body = 'x'.repeat(1024 * 1024 + 1);

    expect((await POST(delivery({ body }))).status).toBe(413);
    expect(mocks.handleShopifyDelivery).not.toHaveBeenCalled();
  });
});
