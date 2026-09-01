import { sql } from 'drizzle-orm';
import { check, index, integer, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { adminUsers, privateSchema } from './admin-identity';

/**
 * Esquema de contenido y activos del panel (Fase 2) — schema `private`.
 * ---------------------------------------------------------------------
 * Ciclos de estado:
 * - contenido: borrador → revisión → publicado → archivado;
 * - activos: pendiente → aprobado → archivado;
 * - lanzamientos con sus pistas (relación 1:N).
 * Fechas y actores (created_by/updated_by) para cambios importantes.
 */

/** Activos multimedia (metadatos; el almacenamiento es provider-neutral). */
export const assets = privateSchema.table(
  'assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Clave de almacenamiento en el proveedor (p. ej. bucket/objeto). */
    storageKey: text('storage_key').notNull(),
    filename: text('filename').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    altText: text('alt_text'),
    /** CHECK: pending | approved | archived. */
    status: text('status').notNull().default('pending'),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('assets_status_check', sql`${table.status} IN ('pending', 'approved', 'archived')`),
    index('assets_status_idx').on(table.status),
  ],
);

/** Entradas de contenido editorial. */
export const contentEntries = privateSchema.table(
  'content_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    body: text('body'),
    /** CHECK: draft | review | published | archived. */
    status: text('status').notNull().default('draft'),
    version: integer('version').notNull().default(1),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('content_entries_slug_unique').on(table.slug),
    check(
      'content_entries_status_check',
      sql`${table.status} IN ('draft', 'review', 'published', 'archived')`,
    ),
    index('content_entries_status_idx').on(table.status),
    index('content_entries_schedule_idx')
      .on(table.scheduledAt)
      .where(sql`${table.status} = 'review' AND ${table.scheduledAt} IS NOT NULL`),
  ],
);

/** Lanzamientos (álbumes/EPs) con su portada opcional. */
export const releases = privateSchema.table(
  'releases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    coverAssetId: uuid('cover_asset_id').references(() => assets.id, { onDelete: 'set null' }),
    /** CHECK: draft | review | published | archived. */
    status: text('status').notNull().default('draft'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('releases_slug_unique').on(table.slug),
    check(
      'releases_status_check',
      sql`${table.status} IN ('draft', 'review', 'published', 'archived')`,
    ),
    index('releases_status_idx').on(table.status),
    index('releases_schedule_idx')
      .on(table.scheduledAt)
      .where(sql`${table.status} = 'review' AND ${table.scheduledAt} IS NOT NULL`),
  ],
);

/** Pistas de un lanzamiento (relación 1:N). */
export const tracks = privateSchema.table(
  'tracks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    releaseId: uuid('release_id')
      .notNull()
      .references(() => releases.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    durationSeconds: integer('duration_seconds'),
    hz: integer('hz'),
    audioAssetId: uuid('audio_asset_id').references(() => assets.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('tracks_release_id_idx').on(table.releaseId)],
);
