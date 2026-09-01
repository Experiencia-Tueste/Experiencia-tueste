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
        'brand.website_url',
        'organization.legal_name',
        'organization.tax_id',
        'contact.support_email',
        'contact.sales_email',
        'contact.whatsapp',
        'commerce.default_coupon_reference',
        'integrations.shopify_store_url'
      )`,
    ),
  ],
);

/** Estado visible de integraciones; las credenciales nunca se persisten aquí. */
export const adminIntegrations = privateSchema.table(
  'admin_integrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: text('provider').notNull(),
    label: text('label').notNull(),
    status: text('status').notNull().default('disconnected'),
    publicReference: text('public_reference'),
    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('admin_integrations_provider_unique').on(table.provider),
    index('admin_integrations_status_idx').on(table.status),
    index('admin_integrations_updated_by_idx').on(table.updatedBy),
    check(
      'admin_integrations_status_check',
      sql`${table.status} IN ('disconnected', 'configured', 'degraded', 'disabled')`,
    ),
  ],
);

/** Referencias operativas de cupones; no reemplazan al proveedor comercial. */
export const couponReferences = privateSchema.table(
  'coupon_references',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    label: text('label').notNull(),
    externalId: text('external_id'),
    status: text('status').notNull().default('active'),
    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('coupon_references_code_unique').on(table.code),
    index('coupon_references_status_idx').on(table.status),
    index('coupon_references_updated_by_idx').on(table.updatedBy),
    check(
      'coupon_references_status_check',
      sql`${table.status} IN ('active', 'inactive', 'expired')`,
    ),
  ],
);
