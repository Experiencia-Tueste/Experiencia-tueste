import { sql } from 'drizzle-orm';
import { check, index, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { adminUsers, privateSchema } from './admin-identity';

export const radioCompanies = privateSchema.table(
  'radio_companies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    contactName: text('contact_name').notNull(),
    contactEmail: text('contact_email').notNull(),
    city: text('city').notNull(),
    status: text('status').notNull().default('active'),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('radio_companies_email_unique').on(table.contactEmail),
    index('radio_companies_status_idx').on(table.status),
    index('radio_companies_created_by_idx').on(table.createdBy),
    check('radio_companies_status_check', sql`${table.status} IN ('active', 'inactive')`),
  ],
);

export const radioChannels = privateSchema.table(
  'radio_channels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => radioCompanies.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    planId: text('plan_id').notNull(),
    subscriptionStatus: text('subscription_status').notNull().default('pending'),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('radio_channels_company_name_unique').on(table.companyId, table.name),
    index('radio_channels_company_id_idx').on(table.companyId),
    index('radio_channels_subscription_status_idx').on(table.subscriptionStatus),
    index('radio_channels_created_by_idx').on(table.createdBy),
    check(
      'radio_channels_plan_check',
      sql`${table.planId} IN ('senal', 'disenada', 'personalizada')`,
    ),
    check(
      'radio_channels_subscription_status_check',
      sql`${table.subscriptionStatus} IN ('pending', 'trial', 'active', 'paused', 'cancelled')`,
    ),
  ],
);
