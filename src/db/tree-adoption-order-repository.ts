import 'server-only';

import { and, eq, sql } from 'drizzle-orm';
import { getDb } from './client';
import { treeAdoptionOrders } from './schema/tree-adoption-orders';

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
