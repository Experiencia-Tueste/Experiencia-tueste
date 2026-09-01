import { sql } from 'drizzle-orm';
import { check, index, integer, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { farmLots } from './admin-compliance';
import { adminEvents } from './admin-events';
import { adminUsers, privateSchema, vendors } from './admin-identity';

/** Operación de Tueste Tree vinculada al lote agrícola real. */
export const treeAdoptions = privateSchema.table(
  'tree_adoptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lotId: uuid('lot_id')
      .notNull()
      .references(() => farmLots.id, { onDelete: 'restrict' }),
    adopterName: text('adopter_name').notNull(),
    adopterEmail: text('adopter_email').notNull(),
    treesCount: integer('trees_count').notNull().default(1),
    certificateCode: text('certificate_code').notNull(),
    status: text('status').notNull().default('pending'),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('tree_adoptions_certificate_unique').on(table.certificateCode),
    index('tree_adoptions_lot_status_idx').on(table.lotId, table.status),
    index('tree_adoptions_email_idx').on(table.adopterEmail),
    check('tree_adoptions_count_check', sql`${table.treesCount} > 0`),
    check(
      'tree_adoptions_status_check',
      sql`${table.status} IN ('pending', 'active', 'fulfilled', 'cancelled')`,
    ),
  ],
);

/** Catálogo moderado de productos y experiencias de vendedores. */
export const marketListings = privateSchema.table(
  'market_listings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    category: text('category').notNull(),
    inventory: integer('inventory').notNull().default(0),
    priceCents: integer('price_cents').notNull(),
    status: text('status').notNull().default('draft'),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('market_listings_vendor_status_idx').on(table.vendorId, table.status),
    check('market_listings_inventory_check', sql`${table.inventory} >= 0`),
    check('market_listings_price_check', sql`${table.priceCents} > 0`),
    check(
      'market_listings_status_check',
      sql`${table.status} IN ('draft', 'review', 'published', 'paused', 'archived')`,
    ),
  ],
);

/** Pipeline comercial B2B de Tueste Unity. */
export const unityOpportunities = privateSchema.table(
  'unity_opportunities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organization: text('organization').notNull(),
    contactName: text('contact_name').notNull(),
    contactEmail: text('contact_email').notNull(),
    service: text('service').notNull(),
    stage: text('stage').notNull().default('lead'),
    estimatedValueCents: integer('estimated_value_cents'),
    nextStep: text('next_step'),
    nextContactAt: timestamp('next_contact_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('unity_opportunities_stage_contact_idx').on(table.stage, table.nextContactAt),
    index('unity_opportunities_email_idx').on(table.contactEmail),
    check(
      'unity_opportunities_stage_check',
      sql`${table.stage} IN ('lead', 'qualified', 'proposal', 'won', 'lost')`,
    ),
    check(
      'unity_opportunities_value_check',
      sql`${table.estimatedValueCents} IS NULL OR ${table.estimatedValueCents} >= 0`,
    ),
  ],
);

/** Subasta controlada; las ofertas se guardan en un ledger separado. */
export const auctionLots = privateSchema.table(
  'auction_lots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lotId: uuid('lot_id').references(() => farmLots.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    reserveCents: integer('reserve_cents').notNull(),
    status: text('status').notNull().default('draft'),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('auction_lots_status_starts_idx').on(table.status, table.startsAt),
    check('auction_lots_dates_check', sql`${table.endsAt} > ${table.startsAt}`),
    check('auction_lots_reserve_check', sql`${table.reserveCents} > 0`),
    check(
      'auction_lots_status_check',
      sql`${table.status} IN ('draft', 'approved', 'open', 'closed', 'cancelled')`,
    ),
  ],
);

export const auctionBids = privateSchema.table(
  'auction_bids',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    auctionId: uuid('auction_id')
      .notNull()
      .references(() => auctionLots.id, { onDelete: 'restrict' }),
    bidderName: text('bidder_name').notNull(),
    bidderEmail: text('bidder_email').notNull(),
    amountCents: integer('amount_cents').notNull(),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('auction_bids_auction_amount_idx').on(table.auctionId, table.amountCents),
    check('auction_bids_amount_check', sql`${table.amountCents} > 0`),
  ],
);

/** Credencial operacional de Backstage ligada opcionalmente a un evento. */
export const backstagePasses = privateSchema.table(
  'backstage_passes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').references(() => adminEvents.id, { onDelete: 'set null' }),
    holderName: text('holder_name').notNull(),
    holderEmail: text('holder_email').notNull(),
    zone: text('zone').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    status: text('status').notNull().default('requested'),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('backstage_passes_status_starts_idx').on(table.status, table.startsAt),
    index('backstage_passes_event_idx').on(table.eventId),
    check('backstage_passes_dates_check', sql`${table.endsAt} > ${table.startsAt}`),
    check(
      'backstage_passes_status_check',
      sql`${table.status} IN ('requested', 'approved', 'issued', 'revoked', 'expired')`,
    ),
  ],
);
