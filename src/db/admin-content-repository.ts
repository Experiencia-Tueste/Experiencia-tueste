import 'server-only';

import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import { getDb } from './client';
import type { DbClient } from './db-types';
import { assets, contentEntries, releases, tracks } from './schema/admin-content';
import type { AssetRow, ContentRow, ReleaseRow, TrackRow } from '@/features/admin/content-types';
import { ASSET_STATUS_SCHEMA, CONTENT_STATUS_SCHEMA } from '@/features/admin/content-schemas';
import type { ContentStatus } from '@/features/admin/content-schemas';

/**
 * Repositorio de contenido del panel — server-only (Drizzle).
 * ---------------------------------------------------------------------
 * Operaciones básicas de contenido, lanzamientos, pistas y activos
 * sobre las tablas migradas (schema `private`). Toda mutación pasa por
 * el servicio (`content-service.ts`) que exige sesión, capacidad y
 * auditoría; este repositorio no autoriza.
 */

function toContentRow(row: typeof contentEntries.$inferSelect): ContentRow {
  const status = CONTENT_STATUS_SCHEMA.parse(row.status);
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    body: row.body,
    status,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    archivedAt: row.archivedAt?.toISOString() ?? null,
  };
}

function toAssetRow(row: typeof assets.$inferSelect): AssetRow {
  const status = ASSET_STATUS_SCHEMA.parse(row.status);
  return {
    id: row.id,
    storageKey: row.storageKey,
    filename: row.filename,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    altText: row.altText,
    status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toTrackRow(row: typeof tracks.$inferSelect): TrackRow {
  return {
    id: row.id,
    releaseId: row.releaseId,
    title: row.title,
    durationSeconds: row.durationSeconds,
    hz: row.hz,
    audioAssetId: row.audioAssetId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toReleaseRow(
  row: typeof releases.$inferSelect,
  releaseTracks: TrackRow[] = [],
): ReleaseRow {
  const status = CONTENT_STATUS_SCHEMA.parse(row.status);
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    coverAssetId: row.coverAssetId,
    status,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    tracks: releaseTracks,
  };
}

export class DrizzleAdminContentRepository {
  async listContent(
    options: { status?: ContentStatus } = {},
    tx?: DbClient,
  ): Promise<ContentRow[]> {
    const db = tx ?? getDb();
    const rows = options.status
      ? await db
          .select()
          .from(contentEntries)
          .where(eq(contentEntries.status, options.status))
          .orderBy(desc(contentEntries.updatedAt))
      : await db.select().from(contentEntries).orderBy(desc(contentEntries.updatedAt));
    return rows.map(toContentRow);
  }

  async getContentById(id: string, tx?: DbClient): Promise<ContentRow | null> {
    const db = tx ?? getDb();
    const [row] = await db.select().from(contentEntries).where(eq(contentEntries.id, id)).limit(1);
    return row ? toContentRow(row) : null;
  }

  async listAssets(tx?: DbClient): Promise<AssetRow[]> {
    const db = tx ?? getDb();
    const rows = await db.select().from(assets).orderBy(desc(assets.updatedAt));
    return rows.map(toAssetRow);
  }

  async getAssetById(id: string, tx?: DbClient): Promise<AssetRow | null> {
    const db = tx ?? getDb();
    const [row] = await db.select().from(assets).where(eq(assets.id, id)).limit(1);
    return row ? toAssetRow(row) : null;
  }

  async listReleases(tx?: DbClient): Promise<ReleaseRow[]> {
    const db = tx ?? getDb();
    const releaseRows = await db.select().from(releases).orderBy(desc(releases.updatedAt));
    if (releaseRows.length === 0) return [];

    const releaseIds = releaseRows.map((release) => release.id);
    const trackRows = await db
      .select()
      .from(tracks)
      .where(inArray(tracks.releaseId, releaseIds))
      .orderBy(tracks.createdAt);

    const tracksByRelease = new Map<string, TrackRow[]>();
    for (const track of trackRows.map(toTrackRow)) {
      const current = tracksByRelease.get(track.releaseId) ?? [];
      current.push(track);
      tracksByRelease.set(track.releaseId, current);
    }

    return releaseRows.map((release) => toReleaseRow(release, tracksByRelease.get(release.id)));
  }

  async getReleaseById(id: string, tx?: DbClient): Promise<ReleaseRow | null> {
    const db = tx ?? getDb();
    const [release] = await db.select().from(releases).where(eq(releases.id, id)).limit(1);
    if (!release) return null;
    const releaseTracks = await db.select().from(tracks).where(eq(tracks.releaseId, id));
    return toReleaseRow(release, releaseTracks.map(toTrackRow));
  }

  async createContentDraft(
    input: {
      title: string;
      slug: string;
      body?: string;
      actorId: string;
    },
    tx?: DbClient,
  ): Promise<ContentRow> {
    const db = tx ?? getDb();
    const [row] = await db
      .insert(contentEntries)
      .values({
        title: input.title,
        slug: input.slug,
        body: input.body ?? null,
        status: 'draft',
        version: 1,
        createdBy: input.actorId,
        updatedBy: input.actorId,
      })
      .returning();
    return toContentRow(row);
  }

  async updateContent(
    id: string,
    input: { title?: string; slug?: string; body?: string },
    actorId: string,
    tx?: DbClient,
  ): Promise<ContentRow | null> {
    const db = tx ?? getDb();
    const [row] = await db
      .update(contentEntries)
      .set({
        ...input,
        version: sql`${contentEntries.version} + 1`,
        updatedBy: actorId,
        updatedAt: new Date(),
      })
      .where(eq(contentEntries.id, id))
      .returning();
    return row ? toContentRow(row) : null;
  }

  /**
   * Cambia el estado de una entrada. El UPDATE exige el estado ACTUAL
   * esperado en el WHERE (`status = from`): si otra operación cambió el
   * estado entre la lectura y la escritura, no se actualiza nada y se
   * devuelve null (sin condiciones de carrera). Incrementa `version`.
   */
  async setContentStatus(
    id: string,
    from: ContentStatus,
    next: ContentStatus,
    actorId: string,
    tx?: DbClient,
  ): Promise<ContentRow | null> {
    const db = tx ?? getDb();
    const now = new Date();
    const [row] = await db
      .update(contentEntries)
      .set({
        status: next,
        version: sql`${contentEntries.version} + 1`,
        updatedBy: actorId,
        updatedAt: now,
        publishedAt: next === 'published' ? now : undefined,
        archivedAt: next === 'archived' ? now : undefined,
        scheduledAt:
          next === 'published' || next === 'archived' || next === 'draft' ? null : undefined,
      })
      .where(and(eq(contentEntries.id, id), eq(contentEntries.status, from)))
      .returning();
    return row ? toContentRow(row) : null;
  }

  async scheduleContent(
    id: string,
    scheduledAt: Date,
    actorId: string,
    tx?: DbClient,
  ): Promise<ContentRow | null> {
    const db = tx ?? getDb();
    const [row] = await db
      .update(contentEntries)
      .set({ scheduledAt, updatedBy: actorId, updatedAt: new Date() })
      .where(and(eq(contentEntries.id, id), eq(contentEntries.status, 'review')))
      .returning();
    return row ? toContentRow(row) : null;
  }

  async setReleaseStatus(
    id: string,
    from: ContentStatus,
    next: ContentStatus,
    actorId: string,
    tx?: DbClient,
  ): Promise<ReleaseRow | null> {
    const db = tx ?? getDb();
    const now = new Date();
    const [row] = await db
      .update(releases)
      .set({
        status: next,
        updatedBy: actorId,
        updatedAt: now,
        publishedAt: next === 'published' ? now : undefined,
        archivedAt: next === 'archived' ? now : undefined,
        scheduledAt:
          next === 'published' || next === 'archived' || next === 'draft' ? null : undefined,
      })
      .where(and(eq(releases.id, id), eq(releases.status, from)))
      .returning();
    return row ? toReleaseRow(row) : null;
  }

  async scheduleRelease(
    id: string,
    scheduledAt: Date,
    actorId: string,
    tx?: DbClient,
  ): Promise<ReleaseRow | null> {
    const db = tx ?? getDb();
    const [row] = await db
      .update(releases)
      .set({ scheduledAt, updatedBy: actorId, updatedAt: new Date() })
      .where(and(eq(releases.id, id), eq(releases.status, 'review')))
      .returning();
    return row ? toReleaseRow(row) : null;
  }

  async setAssetStatus(
    id: string,
    from: AssetRow['status'],
    next: AssetRow['status'],
    tx?: DbClient,
  ): Promise<AssetRow | null> {
    const db = tx ?? getDb();
    const [row] = await db
      .update(assets)
      .set({
        status: next,
        updatedAt: new Date(),
      })
      .where(and(eq(assets.id, id), eq(assets.status, from)))
      .returning();
    return row ? toAssetRow(row) : null;
  }

  async createRelease(
    input: {
      title: string;
      slug: string;
      coverAssetId?: string;
      tracks: Array<{
        title: string;
        durationSeconds?: number;
        hz?: number;
        audioAssetId?: string;
      }>;
      actorId: string;
    },
    tx?: DbClient,
  ): Promise<string> {
    const db = tx ?? getDb();
    const [release] = await db
      .insert(releases)
      .values({
        title: input.title,
        slug: input.slug,
        coverAssetId: input.coverAssetId ?? null,
        status: 'draft',
        createdBy: input.actorId,
        updatedBy: input.actorId,
      })
      .returning({ id: releases.id });

    if (input.tracks.length > 0) {
      await db.insert(tracks).values(
        input.tracks.map((track) => ({
          releaseId: release.id,
          title: track.title,
          durationSeconds: track.durationSeconds ?? null,
          hz: track.hz ?? null,
          audioAssetId: track.audioAssetId ?? null,
        })),
      );
    }

    return release.id;
  }

  async registerAsset(
    input: {
      storageKey: string;
      filename: string;
      mimeType: string;
      sizeBytes: number;
      altText?: string;
      actorId: string;
    },
    tx?: DbClient,
  ): Promise<AssetRow> {
    const db = tx ?? getDb();
    const [asset] = await db
      .insert(assets)
      .values({
        storageKey: input.storageKey,
        filename: input.filename,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        altText: input.altText ?? null,
        status: 'pending',
        createdBy: input.actorId,
      })
      .returning();
    return toAssetRow(asset);
  }
}

/** Fábrica del repositorio de contenido (server-only): crea una instancia
 *  nueva por llamada (sin estado compartido; las transacciones se pasan
 *  explícitamente con `tx`). */
export function getContentRepository(): DrizzleAdminContentRepository {
  return new DrizzleAdminContentRepository();
}
