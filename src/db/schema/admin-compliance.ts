import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  numeric,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { adminUsers, privateSchema } from './admin-identity';

export const farms = privateSchema.table(
  'farms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    producerName: text('producer_name').notNull(),
    city: text('city').notNull(),
    region: text('region').notNull(),
    contactEmail: text('contact_email'),
    status: text('status').notNull().default('active'),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('farms_status_idx').on(table.status),
    index('farms_created_by_idx').on(table.createdBy),
    check('farms_status_check', sql`${table.status} IN ('active', 'inactive')`),
  ],
);

export const farmLots = privateSchema.table(
  'farm_lots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    farmId: uuid('farm_id')
      .notNull()
      .references(() => farms.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    harvestYear: integer('harvest_year').notNull(),
    variety: text('variety').notNull(),
    process: text('process').notNull(),
    weightKg: numeric('weight_kg', { precision: 12, scale: 2 }),
    status: text('status').notNull().default('growing'),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('farm_lots_code_unique').on(table.code),
    index('farm_lots_farm_id_idx').on(table.farmId),
    index('farm_lots_status_idx').on(table.status),
    index('farm_lots_created_by_idx').on(table.createdBy),
    check(
      'farm_lots_status_check',
      sql`${table.status} IN ('growing', 'harvested', 'stored', 'closed')`,
    ),
    check('farm_lots_year_check', sql`${table.harvestYear} BETWEEN 2000 AND 2200`),
    check('farm_lots_weight_check', sql`${table.weightKg} IS NULL OR ${table.weightKg} >= 0`),
  ],
);

export const complianceRecords = privateSchema.table(
  'compliance_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    farmId: uuid('farm_id')
      .notNull()
      .references(() => farms.id, { onDelete: 'cascade' }),
    lotId: uuid('lot_id').references(() => farmLots.id, { onDelete: 'set null' }),
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    reference: text('reference'),
    issuedAt: timestamp('issued_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    status: text('status').notNull().default('pending'),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('compliance_records_farm_id_idx').on(table.farmId),
    index('compliance_records_lot_id_idx').on(table.lotId),
    index('compliance_records_expires_at_idx').on(table.expiresAt),
    index('compliance_records_status_idx').on(table.status),
    index('compliance_records_created_by_idx').on(table.createdBy),
    check(
      'compliance_records_kind_check',
      sql`${table.kind} IN ('certificate', 'inspection', 'document', 'communication')`,
    ),
    check(
      'compliance_records_status_check',
      sql`${table.status} IN ('pending', 'valid', 'rejected', 'archived')`,
    ),
    check(
      'compliance_records_dates_check',
      sql`${table.expiresAt} IS NULL OR ${table.issuedAt} IS NULL OR ${table.expiresAt} > ${table.issuedAt}`,
    ),
  ],
);
