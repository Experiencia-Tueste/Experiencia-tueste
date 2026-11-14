import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const schema = readFileSync(resolve(__dirname, '../schema/tree-adoption-orders.ts'), 'utf8');
const repository = readFileSync(resolve(__dirname, '../tree-adoption-order-repository.ts'), 'utf8');
const migration = readFileSync(
  resolve(__dirname, '../../../drizzle/0023_tree_adoption_orders.sql'),
  'utf8',
);

const paymentMigration = readFileSync(
  resolve(__dirname, '../../../drizzle/0024_tree_adoption_payment.sql'),
  'utf8',
);

describe('persistencia del pago y de los avisos de la tienda', () => {
  it('la migración solo agrega: columnas nuevas y la tabla de avisos, sin borrar ni reescribir', () => {
    expect(paymentMigration).toContain('CREATE TABLE "private"."shopify_webhook_deliveries"');
    expect(paymentMigration).toContain('ADD COLUMN "shopify_order_id" text');
    expect(paymentMigration).not.toMatch(/DROP |DELETE |UPDATE |ALTER COLUMN|SET NOT NULL/);
  });

  it('cierra la tabla de avisos a la Data API', () => {
    expect(paymentMigration).toContain(
      'ALTER TABLE "private"."shopify_webhook_deliveries" ENABLE ROW LEVEL SECURITY;',
    );
    expect(paymentMigration).toContain(
      'REVOKE ALL ON TABLE "private"."shopify_webhook_deliveries" FROM PUBLIC, anon, authenticated;',
    );
  });

  it('un pedido de la tienda activa como máximo una adopción', () => {
    expect(paymentMigration).toMatch(
      /CREATE UNIQUE INDEX "tree_adoption_orders_shopify_order_unique".*WHERE .*"shopify_order_id" IS NOT NULL/,
    );
  });

  it('registra la entrega y aplica su efecto en una sola transacción', () => {
    const helper = repository.slice(
      repository.indexOf('async function withDelivery'),
      repository.indexOf('export async function recordShopifyDelivery'),
    );
    expect(helper).toContain('getDb().transaction');
    expect(helper).toContain('onConflictDoNothing');
    expect(helper).toContain("return 'duplicate'");
  });

  it('activar solo pasa de pending a active y el reembolso bloquea la fila', () => {
    const activate = repository.slice(
      repository.indexOf('export async function activateAdoptionOrder'),
      repository.indexOf('export async function refundAdoptionOrder'),
    );
    expect(activate).toContain("eq(treeAdoptionOrders.status, 'pending')");
    const refund = repository.slice(
      repository.indexOf('export async function refundAdoptionOrder'),
    );
    expect(refund).toContain("eq(treeAdoptionOrders.status, 'active')");
    expect(refund).toContain(".for('update')");
  });
});

describe('persistencia de adopciones pagadas en la tienda', () => {
  it('la migración solo crea la tabla nueva: no altera ni borra nada existente', () => {
    expect(migration).toContain('CREATE TABLE "private"."tree_adoption_orders"');
    expect(migration).not.toMatch(
      /DROP |ALTER TABLE "private"\."(?!tree_adoption_orders")|DELETE |UPDATE /,
    );
  });

  it('cierra la tabla a la Data API: RLS activa y sin permisos para roles públicos', () => {
    expect(migration).toContain(
      'ALTER TABLE "private"."tree_adoption_orders" ENABLE ROW LEVEL SECURITY;',
    );
    expect(migration).toContain(
      'REVOKE ALL ON TABLE "private"."tree_adoption_orders" FROM PUBLIC, anon, authenticated;',
    );
  });

  it('garantiza referencia única y una sola adopción pendiente por cliente', () => {
    expect(migration).toContain('CREATE UNIQUE INDEX "tree_adoption_orders_reference_unique"');
    expect(migration).toMatch(
      /CREATE UNIQUE INDEX "tree_adoption_orders_customer_pending_unique".*\("customer_user_id"\) WHERE .*"status" = 'pending'/,
    );
    expect(schema).toContain("IN ('pending', 'active', 'cancelled')");
  });

  it('reintentar actualiza la pendiente sin cambiar su referencia', () => {
    expect(repository.startsWith("import 'server-only';")).toBe(true);
    expect(repository).toContain('onConflictDoUpdate');
    expect(repository).toContain('targetWhere');
    const update = repository.slice(
      repository.indexOf('set: {'),
      repository.indexOf('.returning()'),
    );
    expect(update).not.toContain('reference');
  });
});
