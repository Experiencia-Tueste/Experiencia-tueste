import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { adminUsers, privateSchema } from './admin-identity';

/**
 * Ledger privado de pagos.
 *
 * La aplicacion publica nunca consulta estas tablas mediante PostgREST.
 * Next.js crea el snapshot comercial y el servicio Spring Boot controla
 * exclusivamente la comunicacion con Mercado Pago y las transiciones.
 */
export const checkoutOrders = privateSchema.table(
  'checkout_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerUserId: uuid('customer_user_id').notNull(),
    customerEmail: text('customer_email').notNull(),
    clientRequestId: uuid('client_request_id').notNull(),
    currency: text('currency').notNull().default('COP'),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    status: text('status').notNull().default('draft'),
    provider: text('provider').notNull().default('mercadopago'),
    providerOrderId: text('provider_order_id'),
    providerStatus: text('provider_status'),
    providerStatusDetail: text('provider_status_detail'),
    checkoutUrl: text('checkout_url'),
    idempotencyKey: uuid('idempotency_key').notNull().defaultRandom(),
    note: text('note'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('checkout_orders_customer_request_unique').on(
      table.customerUserId,
      table.clientRequestId,
    ),
    uniqueIndex('checkout_orders_idempotency_unique').on(table.idempotencyKey),
    uniqueIndex('checkout_orders_provider_order_unique')
      .on(table.providerOrderId)
      .where(sql`${table.providerOrderId} IS NOT NULL`),
    index('checkout_orders_customer_created_idx').on(table.customerUserId, table.createdAt),
    index('checkout_orders_status_updated_idx').on(table.status, table.updatedAt),
    check('checkout_orders_amount_positive', sql`${table.amount} > 0`),
    check('checkout_orders_currency_check', sql`${table.currency} IN ('COP')`),
    check('checkout_orders_provider_check', sql`${table.provider} IN ('mercadopago')`),
    check(
      'checkout_orders_status_check',
      sql`${table.status} IN (
        'draft', 'checkout_created', 'pending', 'paid', 'failed', 'canceled',
        'expired', 'partially_refunded', 'refunded', 'charged_back'
      )`,
    ),
  ],
);

/** Snapshot inmutable del catalogo al confirmar el carrito. */
export const checkoutOrderItems = privateSchema.table(
  'checkout_order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => checkoutOrders.id, { onDelete: 'cascade' }),
    productId: text('product_id').notNull(),
    title: text('title').notNull(),
    unitPrice: bigint('unit_price', { mode: 'number' }).notNull(),
    quantity: integer('quantity').notNull(),
    totalAmount: bigint('total_amount', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('checkout_order_items_order_product_unique').on(table.orderId, table.productId),
    index('checkout_order_items_order_idx').on(table.orderId),
    check('checkout_order_items_unit_price_positive', sql`${table.unitPrice} > 0`),
    check('checkout_order_items_quantity_positive', sql`${table.quantity} > 0`),
    check(
      'checkout_order_items_total_consistent',
      sql`${table.totalAmount} = ${table.unitPrice} * ${table.quantity}`,
    ),
  ],
);

/** Intentos observables sin datos de tarjeta ni secretos del proveedor. */
export const paymentAttempts = privateSchema.table(
  'payment_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => checkoutOrders.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull().default('mercadopago'),
    providerPaymentId: text('provider_payment_id'),
    providerStatus: text('provider_status'),
    status: text('status').notNull().default('created'),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('payment_attempts_order_created_idx').on(table.orderId, table.createdAt),
    uniqueIndex('payment_attempts_provider_payment_unique')
      .on(table.providerPaymentId)
      .where(sql`${table.providerPaymentId} IS NOT NULL`),
    check('payment_attempts_amount_positive', sql`${table.amount} > 0`),
    check(
      'payment_attempts_status_check',
      sql`${table.status} IN ('created', 'pending', 'approved', 'rejected', 'canceled', 'refunded')`,
    ),
  ],
);

/** Inbox idempotente de webhooks; se conserva hash, no el payload sensible. */
export const paymentEvents = privateSchema.table(
  'payment_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: text('provider').notNull().default('mercadopago'),
    providerEventId: text('provider_event_id').notNull(),
    resourceId: text('resource_id').notNull(),
    eventType: text('event_type').notNull(),
    action: text('action'),
    payloadHash: text('payload_hash').notNull(),
    signatureValid: boolean('signature_valid').notNull().default(false),
    status: text('status').notNull().default('received'),
    failureReason: text('failure_reason'),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('payment_events_provider_event_unique').on(table.provider, table.providerEventId),
    index('payment_events_resource_idx').on(table.resourceId),
    index('payment_events_status_received_idx').on(table.status, table.receivedAt),
    check(
      'payment_events_status_check',
      sql`${table.status} IN ('received', 'processing', 'processed', 'ignored', 'failed')`,
    ),
  ],
);

/** Solicitudes de devolucion auditables; la operacion real vive en Spring. */
export const paymentRefunds = privateSchema.table(
  'payment_refunds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => checkoutOrders.id, { onDelete: 'restrict' }),
    paymentAttemptId: uuid('payment_attempt_id').references(() => paymentAttempts.id, {
      onDelete: 'set null',
    }),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    status: text('status').notNull().default('requested'),
    providerRefundId: text('provider_refund_id'),
    reason: text('reason').notNull(),
    requestedBy: uuid('requested_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('payment_refunds_order_created_idx').on(table.orderId, table.createdAt),
    uniqueIndex('payment_refunds_provider_refund_unique')
      .on(table.providerRefundId)
      .where(sql`${table.providerRefundId} IS NOT NULL`),
    check('payment_refunds_amount_positive', sql`${table.amount} > 0`),
    check(
      'payment_refunds_status_check',
      sql`${table.status} IN ('requested', 'processing', 'completed', 'rejected', 'failed')`,
    ),
  ],
);

/** Registro de JWT internos consumidos para impedir replay entre servicios. */
export const serviceJwtReplays = privateSchema.table(
  'service_jwt_replays',
  {
    jti: text('jti').primaryKey(),
    subject: uuid('subject').notNull(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => checkoutOrders.id, { onDelete: 'cascade' }),
    claims: jsonb('claims')
      .notNull()
      .default(sql`'{}'::jsonb`),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('service_jwt_replays_expires_idx').on(table.expiresAt)],
);
