import { sql } from 'drizzle-orm';
import { check, index, integer, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { privateSchema } from './admin-identity';

/**
 * Adopciones iniciadas por el cliente en Experiencia y pagadas en la
 * tienda Tueste Co (Shopify).
 *
 * Experiencia no cobra: guarda la elección (árbol, nombre, cantidad) con
 * una referencia opaca que viaja en el carrito de la tienda. La adopción
 * nace `pending`; el aviso de pago de la tienda la activa y un reembolso
 * la cancela (esas transiciones llegan con la ruta del aviso).
 *
 * Es una tabla distinta de `tree_adoptions`, que opera el panel y exige
 * lote agrícola y certificado desde el primer momento.
 */
export const treeAdoptionOrders = privateSchema.table(
  'tree_adoption_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerUserId: uuid('customer_user_id').notNull(),
    customerEmail: text('customer_email').notNull(),
    treeKey: text('tree_key').notNull(),
    treeName: text('tree_name').notNull(),
    treesCount: integer('trees_count').notNull(),
    reference: text('reference').notNull(),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('tree_adoption_orders_reference_unique').on(table.reference),
    // Un cliente tiene como máximo una adopción pendiente: reintentar el
    // pago actualiza esa fila en vez de crear duplicados.
    uniqueIndex('tree_adoption_orders_customer_pending_unique')
      .on(table.customerUserId)
      .where(sql`${table.status} = 'pending'`),
    index('tree_adoption_orders_customer_created_idx').on(table.customerUserId, table.createdAt),
    check('tree_adoption_orders_count_check', sql`${table.treesCount} > 0`),
    check(
      'tree_adoption_orders_status_check',
      sql`${table.status} IN ('pending', 'active', 'cancelled')`,
    ),
  ],
);
