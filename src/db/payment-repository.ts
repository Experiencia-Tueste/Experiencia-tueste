import 'server-only';

import { and, desc, eq } from 'drizzle-orm';
import { getDb } from './client';
import { checkoutOrderItems, checkoutOrders } from './schema/payments';

export interface NewCheckoutItem {
  productId: string;
  title: string;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
}

export interface NewCheckoutOrder {
  customerUserId: string;
  customerEmail: string;
  clientRequestId: string;
  amount: number;
  note?: string;
  items: NewCheckoutItem[];
}

export async function createOrGetCheckoutOrder(input: NewCheckoutOrder) {
  const db = getDb();

  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(checkoutOrders)
      .values({
        customerUserId: input.customerUserId,
        customerEmail: input.customerEmail,
        clientRequestId: input.clientRequestId,
        amount: input.amount,
        note: input.note,
      })
      .onConflictDoNothing({
        target: [checkoutOrders.customerUserId, checkoutOrders.clientRequestId],
      })
      .returning();

    if (inserted[0]) {
      await tx.insert(checkoutOrderItems).values(
        input.items.map((item) => ({
          orderId: inserted[0].id,
          ...item,
        })),
      );
      return inserted[0];
    }

    const existing = await tx
      .select()
      .from(checkoutOrders)
      .where(
        and(
          eq(checkoutOrders.customerUserId, input.customerUserId),
          eq(checkoutOrders.clientRequestId, input.clientRequestId),
        ),
      )
      .limit(1);

    if (!existing[0]) throw new Error('No fue posible recuperar la orden idempotente.');
    return existing[0];
  });
}

export async function getCheckoutOrderForCustomer(orderId: string, customerUserId: string) {
  const rows = await getDb()
    .select()
    .from(checkoutOrders)
    .where(and(eq(checkoutOrders.id, orderId), eq(checkoutOrders.customerUserId, customerUserId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listRecentCheckoutOrders(limit = 100) {
  return getDb().select().from(checkoutOrders).orderBy(desc(checkoutOrders.createdAt)).limit(limit);
}
