import type { AssetStatus, ContentStatus } from './content-schemas';

/**
 * Tipos puros de contenido del panel (sin server-only): pueden
 * importarse desde componentes cliente solo como tipos.
 */

/** Fila de contenido tal como la expone el repositorio. */
export interface ContentRow {
  id: string;
  title: string;
  slug: string;
  body: string | null;
  status: ContentStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  scheduledAt?: string | null;
  archivedAt: string | null;
}

/** Activo multimedia registrado en el panel. */
export interface AssetRow {
  id: string;
  storageKey: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  altText: string | null;
  status: AssetStatus;
  createdAt: string;
  updatedAt: string;
  /**
   * URL firmada temporal para preview (solo imágenes), generada en
   * servidor cuando Storage está configurado. `null` si no aplica o
   * si la generación falló.
   */
  previewUrl?: string | null;
}

/** Pista perteneciente a un lanzamiento. */
export interface TrackRow {
  id: string;
  releaseId: string;
  title: string;
  durationSeconds: number | null;
  hz: number | null;
  audioAssetId: string | null;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string | null;
}

/** Lanzamiento con sus pistas asociadas. */
export interface ReleaseRow {
  id: string;
  title: string;
  slug: string;
  coverAssetId: string | null;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  tracks: TrackRow[];
}
