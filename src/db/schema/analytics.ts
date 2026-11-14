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

/** Señales first-party sin identidad directa ni payload de formulario. */
export const analyticsEvents = privateSchema.table(
  'analytics_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull(),
    eventName: text('event_name').notNull(),
    eventVersion: integer('event_version').notNull().default(1),
    source: text('source').notNull().default('web'),
    properties: jsonb('properties')
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('analytics_events_event_id_unique').on(table.eventId),
    index('analytics_events_name_created_idx').on(table.eventName, table.createdAt),
    check('analytics_events_version_check', sql`${table.eventVersion} > 0`),
    check('analytics_events_source_check', sql`${table.source} IN ('web', 'server')`),
  ],
);

/** Errores operativos correlacionables, sin mensaje ni request payload. */
export const operationalErrors = privateSchema.table(
  'operational_errors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    requestId: uuid('request_id').notNull(),
    route: text('route').notNull(),
    operation: text('operation').notNull(),
    status: integer('status').notNull(),
    errorCode: text('error_code').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('operational_errors_route_created_idx').on(table.route, table.createdAt),
    index('operational_errors_request_idx').on(table.requestId),
    check(
      'operational_errors_status_check',
      sql`${table.status} >= 400 AND ${table.status} <= 599`,
    ),
  ],
);
