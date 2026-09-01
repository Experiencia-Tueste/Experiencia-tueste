/** Proyección pública: nunca expone estados internos, actores ni storage keys. */
export interface PublicEditorialEntry {
  id: string;
  title: string;
  slug: string;
  body: string | null;
  publishedAt: string;
}

export interface PublicReleaseTrack {
  id: string;
  title: string;
  durationSeconds: number | null;
  hz: number | null;
  audioUrl: string | null;
}

export interface PublicRelease {
  id: string;
  title: string;
  slug: string;
  publishedAt: string;
  coverUrl: string | null;
  coverAlt: string;
  tracks: PublicReleaseTrack[];
}

export interface PublicEditorialProjection {
  entries: PublicEditorialEntry[];
  releases: PublicRelease[];
}

export const EMPTY_PUBLIC_EDITORIAL_PROJECTION: PublicEditorialProjection = {
  entries: [],
  releases: [],
};
