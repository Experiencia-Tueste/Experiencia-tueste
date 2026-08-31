import 'server-only';

import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm';

import { getDb } from './client';
import { assets, contentEntries, releases, tracks } from './schema/admin-content';

/**
 * Filas internas mínimas para construir la proyección pública. Las claves de
 * Storage permanecen en servidor y el servicio las reemplaza por URLs firmadas.
 */
export interface PublishedEntryRecord {
  id: string;
  title: string;
  slug: string;
  body: string | null;
  publishedAt: Date;
}

export interface PublishedAssetRecord {
  id: string;
  storageKey: string;
  altText: string | null;
}

export interface PublishedTrackRecord {
  id: string;
  releaseId: string;
  title: string;
  durationSeconds: number | null;
  hz: number | null;
  audioAssetId: string | null;
}

export interface PublishedReleaseRecord {
  id: string;
  title: string;
  slug: string;
  coverAssetId: string | null;
  publishedAt: Date;
  tracks: PublishedTrackRecord[];
  assets: Map<string, PublishedAssetRecord>;
}

export class DrizzlePublicContentRepository {
  async listPublishedEntries(limit = 6): Promise<PublishedEntryRecord[]> {
    const rows = await getDb()
      .select({
        id: contentEntries.id,
        title: contentEntries.title,
        slug: contentEntries.slug,
        body: contentEntries.body,
        publishedAt: contentEntries.publishedAt,
      })
      .from(contentEntries)
      .where(and(eq(contentEntries.status, 'published'), isNotNull(contentEntries.publishedAt)))
      .orderBy(desc(contentEntries.publishedAt))
      .limit(limit);

    return rows.flatMap((row) =>
      row.publishedAt === null ? [] : [{ ...row, publishedAt: row.publishedAt }],
    );
  }

  async listPublishedReleases(limit = 6): Promise<PublishedReleaseRecord[]> {
    const releaseRows = await getDb()
      .select({
        id: releases.id,
        title: releases.title,
        slug: releases.slug,
        coverAssetId: releases.coverAssetId,
        publishedAt: releases.publishedAt,
      })
      .from(releases)
      .where(and(eq(releases.status, 'published'), isNotNull(releases.publishedAt)))
      .orderBy(desc(releases.publishedAt))
      .limit(limit);

    const published = releaseRows.flatMap((row) =>
      row.publishedAt === null ? [] : [{ ...row, publishedAt: row.publishedAt }],
    );
    if (published.length === 0) return [];

    const releaseIds = published.map((release) => release.id);
    const trackRows = await getDb()
      .select({
        id: tracks.id,
        releaseId: tracks.releaseId,
        title: tracks.title,
        durationSeconds: tracks.durationSeconds,
        hz: tracks.hz,
        audioAssetId: tracks.audioAssetId,
      })
      .from(tracks)
      .where(inArray(tracks.releaseId, releaseIds))
      .orderBy(tracks.createdAt);

    const assetIds = [
      ...published.map((release) => release.coverAssetId),
      ...trackRows.map((track) => track.audioAssetId),
    ].filter((id): id is string => id !== null);

    const assetRows =
      assetIds.length === 0
        ? []
        : await getDb()
            .select({
              id: assets.id,
              storageKey: assets.storageKey,
              altText: assets.altText,
            })
            .from(assets)
            .where(and(inArray(assets.id, assetIds), eq(assets.status, 'approved')));
    const approvedAssets = new Map(assetRows.map((asset) => [asset.id, asset]));

    return published.map((release) => ({
      ...release,
      tracks: trackRows.filter((track) => track.releaseId === release.id),
      assets: approvedAssets,
    }));
  }
}

export function getPublicContentRepository(): DrizzlePublicContentRepository {
  return new DrizzlePublicContentRepository();
}
