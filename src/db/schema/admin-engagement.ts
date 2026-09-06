import { sql } from 'drizzle-orm';
import { check, index, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

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
    status: text('status').notNull().default('pending'),
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
  ],
);
