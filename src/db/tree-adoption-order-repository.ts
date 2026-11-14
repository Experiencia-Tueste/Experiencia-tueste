import 'server-only';

import { and, eq, sql } from 'drizzle-orm';
import { getDb } from './client';
import { shopifyWebhookDeliveries, treeAdoptionOrders } from './schema/tree-adoption-orders';

export type TreeAdoptionOrder = typeof treeAdoptionOrders.$inferSelect;

export interface PendingAdoptionOrderInput {
  customerUserId: string;
  customerEmail: string;
  treeKey: string;
  treeName: string;
  treesCount: number;
  /** Referencia nueva; solo se usa si el cliente no tenía una pendiente. */
  reference: string;
}

/** Adopción pendiente de pago del cliente, si tiene una. */
export async function findPendingAdoptionOrder(
  customerUserId: string,
): Promise<TreeAdoptionOrder | null> {
  const rows = await getDb()
    .select()
    .from(treeAdoptionOrders)
    .where(
      and(
        eq(treeAdoptionOrders.customerUserId, customerUserId),
        eq(treeAdoptionOrders.status, 'pending'),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Guarda la elección del cliente como adopción pendiente. Si ya tenía una
 * pendiente, actualiza esa misma fila y CONSERVA su referencia: reintentar
 * el pago nunca crea duplicados ni deja pedidos huérfanos en la tienda.
 * El índice único parcial por cliente hace la operación atómica.
 */
export async function savePendingAdoptionOrder(
  input: PendingAdoptionOrderInput,
): Promise<TreeAdoptionOrder> {
  const [row] = await getDb()
    .insert(treeAdoptionOrders)
    .values({
      customerUserId: input.customerUserId,
      customerEmail: input.customerEmail,
      treeKey: input.treeKey,
      treeName: input.treeName,
      treesCount: input.treesCount,
      reference: input.reference,
    })
    .onConflictDoUpdate({
      target: treeAdoptionOrders.customerUserId,
      targetWhere: sql`${treeAdoptionOrders.status} = 'pending'`,
      set: {
        customerEmail: input.customerEmail,
        treeKey: input.treeKey,
        treeName: input.treeName,
        treesCount: input.treesCount,
        updatedAt: sql`now()`,
      },
    })
    .returning();
  if (!row) throw new Error('No fue posible guardar la adopción pendiente.');
  return row;
}

/** Qué pasó con un aviso de la tienda. */
export type ShopifyDeliveryOutcome =
  /** La adopción pendiente quedó activa con la cantidad pagada. */
  | 'activated'
  /** Reembolso total: la adopción quedó cancelada. */
  | 'cancelled'
  /** Reembolso parcial: bajó la cantidad de árboles. */
  | 'reduced'
  /** El aviso no corresponde a ninguna adopción en el estado esperado. */
  | 'unmatched'
  /** Aviso válido que no afecta adopciones (otro tema, otro producto…). */
  | 'ignored'
  /** Entrega repetida: ya se había atendido y no se volvió a aplicar. */
  | 'duplicate';

type Tx = Parameters<Parameters<ReturnType<typeof getDb>['transaction']>[0]>[0];

/**
 * Registra la entrega y aplica su efecto en UNA transacción. Si la
 * entrega ya existía devuelve `duplicate` sin tocar nada; si el efecto
 * falla se revierte también el registro y Shopify puede reintentar.
 */
async function withDelivery(
  deliveryId: string,
  topic: string,
  effect: (tx: Tx) => Promise<Exclude<ShopifyDeliveryOutcome, 'duplicate'>>,
): Promise<ShopifyDeliveryOutcome> {
  return getDb().transaction(async (tx) => {
    const inserted = await tx
      .insert(shopifyWebhookDeliveries)
      .values({ deliveryId, topic, outcome: 'processing' })
      .onConflictDoNothing({ target: shopifyWebhookDeliveries.deliveryId })
      .returning({ deliveryId: shopifyWebhookDeliveries.deliveryId });
    if (!inserted[0]) return 'duplicate';

    const outcome = await effect(tx);
    await tx
      .update(shopifyWebhookDeliveries)
      .set({ outcome })
      .where(eq(shopifyWebhookDeliveries.deliveryId, deliveryId));
    return outcome;
  });
}

/** Deja constancia de un aviso que no cambia ninguna adopción. */
export async function recordShopifyDelivery(
  deliveryId: string,
  topic: string,
  outcome: 'ignored' | 'unmatched',
): Promise<ShopifyDeliveryOutcome> {
  return withDelivery(deliveryId, topic, async () => outcome);
}

/**
 * Pedido pagado: activa la adopción pendiente de esa referencia con la
 * cantidad que de verdad se pagó. Solo pasa de `pending` a `active`.
 */
export async function activateAdoptionOrder(input: {
  deliveryId: string;
  topic: string;
  reference: string;
  shopifyOrderId: string;
  treesCount: number;
}): Promise<ShopifyDeliveryOutcome> {
  return withDelivery(input.deliveryId, input.topic, async (tx) => {
    const updated = await tx
      .update(treeAdoptionOrders)
      .set({
        status: 'active',
        treesCount: input.treesCount,
        shopifyOrderId: input.shopifyOrderId,
        paidAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(treeAdoptionOrders.reference, input.reference),
          eq(treeAdoptionOrders.status, 'pending'),
        ),
      )
      .returning({ id: treeAdoptionOrders.id });
    return updated[0] ? 'activated' : 'unmatched';
  });
}

/**
 * Reembolso: si devuelve todos los árboles cancela la adopción activa de
 * ese pedido; si devuelve menos, baja la cantidad. La fila se bloquea
 * para que dos reembolsos simultáneos no se pisen.
 */
export async function refundAdoptionOrder(input: {
  deliveryId: string;
  topic: string;
  shopifyOrderId: string;
  refundedTrees: number;
}): Promise<ShopifyDeliveryOutcome> {
  return withDelivery(input.deliveryId, input.topic, async (tx) => {
    const [order] = await tx
      .select({ id: treeAdoptionOrders.id, treesCount: treeAdoptionOrders.treesCount })
      .from(treeAdoptionOrders)
      .where(
        and(
          eq(treeAdoptionOrders.shopifyOrderId, input.shopifyOrderId),
          eq(treeAdoptionOrders.status, 'active'),
        ),
      )
      .limit(1)
      .for('update');
    if (!order) return 'unmatched';

    if (input.refundedTrees >= order.treesCount) {
      await tx
        .update(treeAdoptionOrders)
        .set({ status: 'cancelled', cancelledAt: sql`now()`, updatedAt: sql`now()` })
        .where(eq(treeAdoptionOrders.id, order.id));
      return 'cancelled';
    }
    await tx
      .update(treeAdoptionOrders)
      .set({ treesCount: order.treesCount - input.refundedTrees, updatedAt: sql`now()` })
      .where(eq(treeAdoptionOrders.id, order.id));
    return 'reduced';
  });
}
