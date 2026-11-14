import 'server-only';

import {
  activateAdoptionOrder,
  recordShopifyDelivery,
  refundAdoptionOrder,
  type ShopifyDeliveryOutcome,
} from '@/db/tree-adoption-order-repository';
import { parsePaidOrder, parseRefund, SHOPIFY_TOPICS } from './shopify-webhook';

export interface ShopifyDelivery {
  /** Identificador de la entrega (cabecera de Shopify), para no repetirla. */
  deliveryId: string;
  topic: string;
  /** Cuerpo crudo, ya verificado con la firma. */
  rawBody: string;
}

/**
 * Atiende un aviso YA VERIFICADO de la tienda.
 *
 * - `orders/paid`: activa la adopción pendiente cuya referencia viajó en
 *   el carrito, con la cantidad de árboles realmente pagada.
 * - `refunds/create`: cancela la adopción si se devuelven todos sus
 *   árboles, o baja la cantidad si la devolución es parcial.
 * - Cualquier otro aviso, o uno que no toca adopciones, se registra y se
 *   ignora. Las entregas repetidas no se vuelven a aplicar.
 */
export async function handleShopifyDelivery(
  delivery: ShopifyDelivery,
): Promise<ShopifyDeliveryOutcome> {
  const { deliveryId, topic, rawBody } = delivery;

  if (topic === SHOPIFY_TOPICS.orderPaid) {
    const order = parsePaidOrder(rawBody);
    if (!order || order.trees === 0) return recordShopifyDelivery(deliveryId, topic, 'ignored');
    // Compró la adopción directo en la tienda, sin pasar por Experiencia.
    if (!order.reference) return recordShopifyDelivery(deliveryId, topic, 'unmatched');
    return activateAdoptionOrder({
      deliveryId,
      topic,
      reference: order.reference,
      shopifyOrderId: order.orderId,
      treesCount: order.trees,
    });
  }

  if (topic === SHOPIFY_TOPICS.refundCreated) {
    const refund = parseRefund(rawBody);
    if (!refund || refund.trees === 0) return recordShopifyDelivery(deliveryId, topic, 'ignored');
    return refundAdoptionOrder({
      deliveryId,
      topic,
      shopifyOrderId: refund.orderId,
      refundedTrees: refund.trees,
    });
  }

  return recordShopifyDelivery(deliveryId, topic, 'ignored');
}
