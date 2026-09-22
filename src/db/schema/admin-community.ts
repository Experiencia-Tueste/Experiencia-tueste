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

import { adminUsers, privateSchema } from './admin-identity';
import { engagementRequests } from './admin-engagement';

export const communityMembers = privateSchema.table(
  'community_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    displayName: text('display_name').notNull(),
    email: text('email').notNull(),
    requesterUserId: uuid('requester_user_id'),
    sourceRequestId: uuid('source_request_id').references(() => engagementRequests.id, {
      onDelete: 'set null',
    }),
    status: text('status').notNull().default('active'),
    notes: text('notes'),
    preferences: jsonb('preferences')
      .notNull()
      .default(sql`'["general"]'::jsonb`),
    consentStatus: text('consent_status').notNull().default('active'),
    consentVersion: integer('consent_version').notNull().default(1),
    consentedAt: timestamp('consented_at', { withTimezone: true }),
    withdrawnAt: timestamp('withdrawn_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('community_members_email_idx').on(table.email),
    uniqueIndex('community_members_requester_user_unique').on(table.requesterUserId),
    uniqueIndex('community_members_source_request_unique').on(table.sourceRequestId),
    index('community_members_status_idx').on(table.status),
    index('community_members_consent_status_idx').on(table.consentStatus),
    index('community_members_created_by_idx').on(table.createdBy),
    check(
      'community_members_status_check',
      sql`${table.status} IN ('active', 'restricted', 'banned')`,
    ),
    check(
      'community_members_consent_status_check',
      sql`${table.consentStatus} IN ('active', 'withdrawn')`,
    ),
    check('community_members_consent_version_check', sql`${table.consentVersion} > 0`),
  ],
);

export const communityConsentEvents = privateSchema.table(
  'community_consent_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => communityMembers.id, { onDelete: 'cascade' }),
    requesterUserId: uuid('requester_user_id').notNull(),
    action: text('action').notNull(),
    preferences: jsonb('preferences').notNull(),
    consentVersion: integer('consent_version').notNull(),
    source: text('source').notNull(),
    actorAdminId: uuid('actor_admin_id').references(() => adminUsers.id, {
      onDelete: 'set null',
    }),
    reason: text('reason'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('community_consent_events_member_idx').on(table.memberId, table.occurredAt),
    index('community_consent_events_user_idx').on(table.requesterUserId, table.occurredAt),
    check(
      'community_consent_events_action_check',
      sql`${table.action} IN ('granted', 'preferences_updated', 'withdrawn', 'restored')`,
    ),
    check('community_consent_events_source_check', sql`${table.source} IN ('public', 'admin')`),
    check('community_consent_events_version_check', sql`${table.consentVersion} > 0`),
  ],
);

export const communityPosts = privateSchema.table(
  'community_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id').references(() => communityMembers.id, { onDelete: 'set null' }),
    authorName: text('author_name').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    status: text('status').notNull().default('visible'),
    reportCount: integer('report_count').notNull().default(0),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('community_posts_member_id_idx').on(table.memberId),
    index('community_posts_status_idx').on(table.status),
    index('community_posts_created_at_idx').on(table.createdAt),
    index('community_posts_created_by_idx').on(table.createdBy),
    check('community_posts_status_check', sql`${table.status} IN ('visible', 'hidden', 'removed')`),
    check('community_posts_report_count_check', sql`${table.reportCount} >= 0`),
  ],
);

export const communityReports = privateSchema.table(
  'community_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => communityPosts.id, { onDelete: 'cascade' }),
    reporterName: text('reporter_name').notNull(),
    category: text('category').notNull(),
    details: text('details'),
    status: text('status').notNull().default('open'),
    resolution: text('resolution'),
    resolvedBy: uuid('resolved_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('community_reports_post_status_idx').on(table.postId, table.status),
    index('community_reports_status_idx').on(table.status),
    index('community_reports_resolved_by_idx').on(table.resolvedBy),
    index('community_reports_created_by_idx').on(table.createdBy),
    check(
      'community_reports_status_check',
      sql`${table.status} IN ('open', 'resolved', 'dismissed')`,
    ),
  ],
);
