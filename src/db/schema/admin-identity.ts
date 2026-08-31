import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Esquema declarativo de identidad administrativa (Drizzle ORM).
 * ---------------------------------------------------------------------
 * SOLO declaración: este archivo no conecta ni consulta nada al
 * importarse. Las tablas viven en el schema `private` de PostgreSQL.
 *
 * Seguridad del lado de la base:
 * - IDs UUID generados por PostgreSQL (`.defaultRandom()`).
 * - Fechas con valor por defecto del servidor (`.defaultNow()`).
 * - Restricciones CHECK para `admin_users.status` y `admin_roles.key`.
 * - El acceso público (anon/authenticated) se revoca en la migración.
 */

export const privateSchema = pgSchema('private');

/** Usuarios del panel administrativo. */
export const adminUsers = privateSchema.table(
  'admin_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Correo normalizado (trim + lowercase). */
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    /** CHECK: invited | active | suspended. */
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    lastSignedInAt: timestamp('last_signed_in_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('admin_users_email_unique').on(table.email),
    check('admin_users_status_check', sql`${table.status} IN ('invited', 'active', 'suspended')`),
  ],
);

/** Roles persistentes del panel (los seis roles existentes). */
export const adminRoles = privateSchema.table(
  'admin_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** CHECK: roles canónicos del panel. */
    key: text('key').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('admin_roles_key_unique').on(table.key),
    check(
      'admin_roles_key_check',
      sql`${table.key} IN ('owner', 'admin', 'editor', 'operador', 'moderador', 'lector', 'vendedor')`,
    ),
  ],
);

/** Capacidades efectivas persistidas por rol. */
export const adminRoleCapabilities = privateSchema.table(
  'admin_role_capabilities',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => adminRoles.id, { onDelete: 'cascade' }),
    capability: text('capability').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.capability] }),
    index('admin_role_capabilities_capability_idx').on(table.capability),
  ],
);

/** Asignación usuario ↔ rol (clave primaria compuesta). */
export const adminUserRoles = privateSchema.table(
  'admin_user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => adminRoles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
    index('admin_user_roles_role_id_idx').on(table.roleId),
  ],
);

/** Auditoría append-only del panel. */
export const auditLogs = privateSchema.table(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorUserId: uuid('actor_user_id').references(() => adminUsers.id, {
      onDelete: 'set null',
    }),
    actorEmail: text('actor_email'),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),
    reason: text('reason'),
    /** JSONB seguro (validado por el contrato de auditoría). */
    metadata: jsonb('metadata')
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_logs_action_idx').on(table.action),
    index('audit_logs_actor_idx').on(table.actorUserId),
    index('audit_logs_target_type_idx').on(table.targetType),
    index('audit_logs_created_at_idx').on(table.createdAt),
  ],
);

/** Vendedor comercial al que se limita el alcance de datos propios. */
export const vendors = privateSchema.table(
  'vendors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    status: text('status').notNull().default('active'),
    commissionBps: integer('commission_bps').notNull().default(0),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('vendors_status_idx').on(table.status),
    index('vendors_created_by_idx').on(table.createdBy),
    check('vendors_status_check', sql`${table.status} IN ('active', 'suspended')`),
    check(
      'vendors_commission_bps_check',
      sql`${table.commissionBps} >= 0 AND ${table.commissionBps} <= 10000`,
    ),
  ],
);

/** Relación explícita entre identidad administrativa y vendedor. */
export const vendorMemberships = privateSchema.table(
  'vendor_memberships',
  {
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.vendorId, table.userId] }),
    uniqueIndex('vendor_memberships_user_unique').on(table.userId),
    index('vendor_memberships_created_by_idx').on(table.createdBy),
  ],
);
