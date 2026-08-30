import { sql } from 'drizzle-orm';
import { check, index, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { adminUsers, privateSchema } from './admin-identity';

/**
 * Configuración pública y no secreta del ecosistema.
 *
 * Los secretos de integraciones permanecen exclusivamente en variables
 * de entorno. Esta tabla solo guarda valores editables desde el panel.
 */
export const adminSettings = privateSchema.table(
  'admin_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').notNull(),
    value: text('value').notNull().default(''),
    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('admin_settings_key_unique').on(table.key),
    index('admin_settings_updated_by_idx').on(table.updatedBy),
    check(
      'admin_settings_key_check',
      sql`${table.key} IN (
        'brand.display_name',
        'brand.tagline',
        'contact.support_email',
        'contact.sales_email',
        'commerce.default_coupon_reference',
        'integrations.shopify_store_url'
      )`,
    ),
  ],
);
