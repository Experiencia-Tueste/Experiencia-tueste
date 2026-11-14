import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const schema = readFileSync(resolve(__dirname, '../schema/tree-adoption-orders.ts'), 'utf8');
const repository = readFileSync(resolve(__dirname, '../tree-adoption-order-repository.ts'), 'utf8');
const migration = readFileSync(
  resolve(__dirname, '../../../drizzle/0023_tree_adoption_orders.sql'),
  'utf8',
);

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
