import { createHmac, timingSafeEqual } from 'node:crypto';
import { ADOPCION_TIENDA, isAdoptionReference } from './purchase';

/**
 * Lectura de los avisos (webhooks) de la tienda Tueste Co.
 *
 * Shopify firma cada aviso con HMAC-SHA256 del cuerpo CRUDO, en base64,
 * en la cabecera `X-Shopify-Hmac-SHA256`. Nada del contenido se usa antes
 * de comprobar esa firma. Lógica pura: sin red ni base de datos.
 */

/** Avisos que Experiencia atiende; el resto se ignora. */
export const SHOPIFY_TOPICS = {
  orderPaid: 'orders/paid',
  refundCreated: 'refunds/create',
} as const;

const SHA256_BYTES = 32;

/**
 * Comprueba la firma del aviso en tiempo constante. Sin secreto
 * configurado rechaza siempre: nunca se acepta un aviso sin poder verificarlo.
 */
export function verifyShopifyHmac(
  rawBody: string,
  signature: string | null | undefined,
  secret: string,
): boolean {
  if (!secret || !signature) return false;
  const received = Buffer.from(signature, 'base64');
  if (received.length !== SHA256_BYTES) return false;
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest();
  return timingSafeEqual(received, expected);
}

export interface PaidOrder {
  /** Identificador numérico del pedido en Shopify, como texto. */
  orderId: string;
  /** Referencia de la adopción que viajó en el carrito, si llegó y es válida. */
  reference: string | null;
  /** Árboles de la adopción pagados en este pedido (0 si no incluye el producto). */
  trees: number;
}

export interface Refund {
  orderId: string;
  /** Árboles de la adopción devueltos en este reembolso. */
  trees: number;
}

function parseObject(rawBody: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(rawBody);
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function isAdoptionVariant(variantId: unknown): boolean {
  return (
    (typeof variantId === 'number' || typeof variantId === 'string') &&
    String(variantId) === ADOPCION_TIENDA.variantId
  );
}

function positiveInteger(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : 0;
}

/**
 * Pedido pagado (`orders/paid`). El identificador sale de
 * `admin_graphql_api_id` (texto) y no de `id`: los enteros de Shopify
 * pueden superar el máximo exacto de un número de JavaScript.
 */
export function parsePaidOrder(rawBody: string): PaidOrder | null {
  const order = parseObject(rawBody);
  if (!order) return null;

  const gid = typeof order.admin_graphql_api_id === 'string' ? order.admin_graphql_api_id : '';
  const orderId = /^gid:\/\/shopify\/Order\/(\d+)$/.exec(gid)?.[1];
  if (!orderId) return null;

  const attributes = Array.isArray(order.note_attributes) ? order.note_attributes : [];
  const candidate = attributes.find(
    (attribute): attribute is { name: string; value: unknown } =>
      typeof attribute === 'object' &&
      attribute !== null &&
      (attribute as { name?: unknown }).name === ADOPCION_TIENDA.refAttribute,
  )?.value;

  const lines = Array.isArray(order.line_items) ? order.line_items : [];
  const trees = lines.reduce((total: number, line: unknown) => {
    if (typeof line !== 'object' || line === null) return total;
    const { variant_id: variantId, quantity } = line as Record<string, unknown>;
    return isAdoptionVariant(variantId) ? total + positiveInteger(quantity) : total;
  }, 0);

  return { orderId, reference: isAdoptionReference(candidate) ? candidate : null, trees };
}

/**
 * Reembolso (`refunds/create`). `order_id` solo viene como número, así
 * que se lee del texto crudo para no perder precisión.
 */
export function parseRefund(rawBody: string): Refund | null {
  const refund = parseObject(rawBody);
  if (!refund) return null;

  const orderId = /"order_id"\s*:\s*(\d+)/.exec(rawBody)?.[1];
  if (!orderId) return null;

  const lines = Array.isArray(refund.refund_line_items) ? refund.refund_line_items : [];
  const trees = lines.reduce((total: number, line: unknown) => {
    if (typeof line !== 'object' || line === null) return total;
    const { quantity, line_item: lineItem } = line as Record<string, unknown>;
    const variantId =
      typeof lineItem === 'object' && lineItem !== null
        ? (lineItem as Record<string, unknown>).variant_id
        : undefined;
    return isAdoptionVariant(variantId) ? total + positiveInteger(quantity) : total;
  }, 0);

  return { orderId, trees };
}
