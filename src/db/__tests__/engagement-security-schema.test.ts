import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const schema = readFileSync(resolve(__dirname, '../schema/admin-engagement.ts'), 'utf8');
const repository = readFileSync(resolve(__dirname, '../admin-engagement-repository.ts'), 'utf8');
const migration = readFileSync(
  resolve(__dirname, '../../../drizzle/0017_fixed_jean_grey.sql'),
  'utf8',
);

describe('persistencia de seguridad de engagements', () => {
  it('declara intención pendiente y buckets compartidos en schema privado', () => {
    expect(schema).toContain("'pending_engagement_intents'");
    expect(schema).toContain("'request_rate_limit_buckets'");
    expect(schema).toContain('primaryKey()');
    expect(schema).toContain("'expires_at'");
    expect(schema).toContain("'consumed_at'");
  });

  it('revoca Data API en las tablas nuevas', () => {
    expect(migration).toContain(
      'REVOKE ALL ON TABLE "private"."pending_engagement_intents", "private"."request_rate_limit_buckets" FROM PUBLIC, anon, authenticated;',
    );
  });

  it('mantiene idempotencia por dominio y usuario en una restricción única', () => {
    expect(repository).toContain('onConflictDoNothing');
    expect(repository).toContain('engagementRequests.type');
    expect(repository).toContain('engagementRequests.requesterUserId');
    expect(repository).toContain('engagementRequests.reference');
  });
});
