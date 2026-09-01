import 'server-only';

import { getPublicContentRepository } from '@/db/public-content-repository';
import type { PublishedAssetRecord } from '@/db/public-content-repository';
import { createAdminStorageProvider } from '@/integrations/storage/supabase-storage';
import type { PublicEditorialProjection } from './types';

const PUBLIC_ASSET_URL_TTL_SECONDS = 60 * 60;

async function signedUrl(
  asset: PublishedAssetRecord | undefined,
  provider: ReturnType<typeof createAdminStorageProvider>,
): Promise<string | null> {
  if (!asset || !provider) return null;
  try {
    return await provider.getSignedUrl(asset.storageKey, PUBLIC_ASSET_URL_TTL_SECONDS);
  } catch (error) {
    console.error(
      '[public-content] no se pudo firmar un activo aprobado.',
      error instanceof Error ? error.name : 'unknown',
    );
    return null;
  }
}

/**
 * Fuente pública canónica. El repositorio filtra `published`; este servicio
 * elimina claves privadas de Storage y entrega únicamente URLs temporales.
 */
export async function getPublicEditorialProjection(): Promise<PublicEditorialProjection> {
  const repository = getPublicContentRepository();
  const [entries, releaseRecords] = await Promise.all([
    repository.listPublishedEntries(),
    repository.listPublishedReleases(),
  ]);
  const provider = createAdminStorageProvider();

  const releases = await Promise.all(
    releaseRecords.map(async (release) => ({
      id: release.id,
      title: release.title,
      slug: release.slug,
      publishedAt: release.publishedAt.toISOString(),
      coverUrl: await signedUrl(
        release.coverAssetId ? release.assets.get(release.coverAssetId) : undefined,
        provider,
      ),
      coverAlt:
        (release.coverAssetId ? release.assets.get(release.coverAssetId)?.altText : null) ??
        `Portada de ${release.title}`,
      tracks: await Promise.all(
        release.tracks.map(async (track) => ({
          id: track.id,
          title: track.title,
          durationSeconds: track.durationSeconds,
          hz: track.hz,
          audioUrl: await signedUrl(
            track.audioAssetId ? release.assets.get(track.audioAssetId) : undefined,
            provider,
          ),
        })),
      ),
    })),
  );

  return {
    entries: entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      slug: entry.slug,
      body: entry.body,
      publishedAt: entry.publishedAt.toISOString(),
    })),
    releases,
  };
}
