import { sql } from 'drizzle-orm';
import { check, index, integer, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { adminUsers, privateSchema } from './admin-identity';

export const communityMembers = privateSchema.table(
  'community_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    displayName: text('display_name').notNull(),
    email: text('email').notNull(),
    status: text('status').notNull().default('active'),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('community_members_email_unique').on(table.email),
    index('community_members_status_idx').on(table.status),
    index('community_members_created_by_idx').on(table.createdBy),
    check(
      'community_members_status_check',
      sql`${table.status} IN ('active', 'restricted', 'banned')`,
    ),
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
