import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  activateAdoptionOrder: vi.fn(),
  recordShopifyDelivery: vi.fn(),
  refundAdoptionOrder: vi.fn(),
}));

vi.mock('@/db/tree-adoption-order-repository', () => ({
  activateAdoptionOrder: mocks.activateAdoptionOrder,
  recordShopifyDelivery: mocks.recordShopifyDelivery,
  refundAdoptionOrder: mocks.refundAdoptionOrder,
}));

import { ADOPCION_TIENDA } from '../purchase';
import { handleShopifyDelivery } from '../shopify-webhook-service';

const VARIANT = Number(ADOPCION_TIENDA.variantId);
const paid = (extra: object = {}) =>
  JSON.stringify({
    admin_graphql_api_id: 'gid://shopify/Order/5123456789012',
    note_attributes: [{ name: 'ref-experiencia', value: 'TT-0123456789ABCDEF' }],
    line_items: [{ variant_id: VARIANT, quantity: 12 }],
    ...extra,
  });
const refund = (quantity: number, variant: number | null = VARIANT) =>
  JSON.stringify({
    id: 900,
    order_id: 5123456789012,
    refund_line_items: [{ quantity, line_item: { variant_id: variant } }],
  });

describe('avisos de la tienda sobre adopciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.activateAdoptionOrder.mockResolvedValue('activated');
    mocks.refundAdoptionOrder.mockResolvedValue('cancelled');
    mocks.recordShopifyDelivery.mockImplementation(
      async (_id: string, _topic: string, outcome: string) => outcome,
    );
  });

  it('pedido pagado: activa la adopción con la cantidad del pedido', async () => {
    const outcome = await handleShopifyDelivery({
      deliveryId: 'd-1',
      topic: 'orders/paid',
      rawBody: paid(),
    });

    expect(outcome).toBe('activated');
    expect(mocks.activateAdoptionOrder).toHaveBeenCalledWith({
      deliveryId: 'd-1',
      topic: 'orders/paid',
      reference: 'TT-0123456789ABCDEF',
      shopifyOrderId: '5123456789012',
      treesCount: 12,
    });
  });

  it('pedido pagado sin referencia: queda como no emparejado y no activa nada', async () => {
    const outcome = await handleShopifyDelivery({
      deliveryId: 'd-2',
      topic: 'orders/paid',
      rawBody: paid({ note_attributes: [] }),
    });

    expect(outcome).toBe('unmatched');
    expect(mocks.activateAdoptionOrder).not.toHaveBeenCalled();
    expect(mocks.recordShopifyDelivery).toHaveBeenCalledWith('d-2', 'orders/paid', 'unmatched');
  });

  it('pedido de otros productos: se ignora', async () => {
    const outcome = await handleShopifyDelivery({
      deliveryId: 'd-3',
      topic: 'orders/paid',
      rawBody: paid({ line_items: [{ variant_id: 999, quantity: 1 }] }),
    });

    expect(outcome).toBe('ignored');
    expect(mocks.activateAdoptionOrder).not.toHaveBeenCalled();
  });

  it('reembolso de árboles: lo aplica al pedido', async () => {
    const outcome = await handleShopifyDelivery({
      deliveryId: 'd-4',
      topic: 'refunds/create',
      rawBody: refund(12),
    });

    expect(outcome).toBe('cancelled');
    expect(mocks.refundAdoptionOrder).toHaveBeenCalledWith({
      deliveryId: 'd-4',
      topic: 'refunds/create',
      shopifyOrderId: '5123456789012',
      refundedTrees: 12,
    });
  });

  it('reembolso que no toca la adopción: se ignora', async () => {
    const outcome = await handleShopifyDelivery({
      deliveryId: 'd-5',
      topic: 'refunds/create',
      rawBody: refund(1, 999),
    });

    expect(outcome).toBe('ignored');
    expect(mocks.refundAdoptionOrder).not.toHaveBeenCalled();
  });

  it.each(['orders/create', 'products/update', 'app/uninstalled'])(
    'otro tema (%s): se registra y se ignora',
    async (topic) => {
      const outcome = await handleShopifyDelivery({ deliveryId: 'd-6', topic, rawBody: paid() });

      expect(outcome).toBe('ignored');
      expect(mocks.activateAdoptionOrder).not.toHaveBeenCalled();
      expect(mocks.refundAdoptionOrder).not.toHaveBeenCalled();
    },
  );

  it('cuerpo ilegible: se ignora sin lanzar', async () => {
    await expect(
      handleShopifyDelivery({ deliveryId: 'd-7', topic: 'orders/paid', rawBody: 'no es json' }),
    ).resolves.toBe('ignored');
  });

  it('entrega repetida: devuelve duplicate tal cual lo decide el repositorio', async () => {
    mocks.activateAdoptionOrder.mockResolvedValue('duplicate');

    await expect(
      handleShopifyDelivery({ deliveryId: 'd-1', topic: 'orders/paid', rawBody: paid() }),
    ).resolves.toBe('duplicate');
  });
});
