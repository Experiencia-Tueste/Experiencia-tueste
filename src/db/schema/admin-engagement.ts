import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { privateSchema } from './admin-identity';

/** Solicitudes autenticadas iniciadas en la experiencia pública. */
export const engagementRequests = privateSchema.table(
  'engagement_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: text('type').notNull(),
    requesterUserId: uuid('requester_user_id').notNull(),
    requesterEmail: text('requester_email').notNull(),
    requesterName: text('requester_name').notNull(),
    reference: text('reference').notNull().default(''),
    details: text('details'),
    payload: jsonb('payload').notNull().default({}),
    status: text('status').notNull().default('pending'),
    radioStage: text('radio_stage'),
    marketStage: text('market_stage'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('engagement_requests_requester_unique').on(
      table.type,
      table.requesterUserId,
      table.reference,
    ),
    index('engagement_requests_status_created_idx').on(table.status, table.createdAt),
    index('engagement_requests_type_reference_idx').on(table.type, table.reference),
    check(
      'engagement_requests_type_check',
      sql`${table.type} IN ('community', 'event', 'radio', 'market')`,
    ),
    check(
      'engagement_requests_status_check',
      sql`${table.status} IN ('pending', 'contacted', 'closed')`,
    ),
    check(
      'engagement_requests_radio_stage_check',
      sql`${table.radioStage} IS NULL OR ${table.radioStage} IN ('new', 'qualified', 'proposal', 'won', 'lost')`,
    ),
    check(
      'engagement_requests_market_stage_check',
      sql`${table.marketStage} IS NULL OR ${table.marketStage} IN ('submitted', 'review', 'approved', 'rejected')`,
    ),
  ],
);

/**
 * Intenciones anónimas de corta duración, previas al login.
 * Solo se persiste el hash del token que viaja en una cookie HttpOnly.
 */
export const pendingEngagementIntents = privateSchema.table(
  'pending_engagement_intents',
  {
    tokenHash: text('token_hash').primaryKey(),
    payload: jsonb('payload').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('pending_engagement_intents_expires_idx').on(table.expiresAt)],
);

/** Buckets compartidos para rate limiting entre instancias del servicio web. */
export const requestRateLimitBuckets = privateSchema.table(
  'request_rate_limit_buckets',
  {
    bucketKey: text('bucket_key').primaryKey(),
    windowStartedAt: timestamp('window_started_at', { withTimezone: true }).notNull(),
    requestCount: integer('request_count').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('request_rate_limit_buckets_updated_idx').on(table.updatedAt)],
);
