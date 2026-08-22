/**
 * Feature: music
 * ---------------------------------------------------------------------
 * Lanzamientos de la discografía de Origen Tostado (sello Logik Pro).
 * Contrato estático y tipado de los cuatro lanzamientos del mockup.
 * No duplica el catálogo de pistas: cada lanzamiento referencia una pista
 * por `TrackId` (ver src/features/audio) y el audio se resuelve desde allí.
 */

import type { TrackId } from '../../lib/audio';

/** Estado de disponibilidad de la compra (Mercado Pago aún no existe). */
export type PurchaseStatus = 'unavailable' | 'available';

/** Temporada visual de la portada (gradiente determinista, fallback). */
export type ReleaseSeason = 'cosecha' | 'floracion' | 'germinacion' | 'tostion';

export interface Release {
  /** Identificador único del lanzamiento. */
  id: string;
  /** Título del lanzamiento. */
  title: string;
  /** Tipo editorial (Álbum · último, EP, EP · Live Ritual…). */
  kind: string;
  /** Año de publicación o estado («2026», «Próximamente»). */
  date: string;
  /** Temporada visual de la portada (fallback editorial mientras no exista el asset). */
  season: ReleaseSeason;
  /** Formatos disponibles. */
  formats: string;
  /** Pista asociada del catálogo de audio. */
  trackId: TrackId;
  /** Precio visible opcional (vacío para lanzamientos próximos). */
  price: string;
  /**
   * Portada local bajo `public/images/releases/` (p. ej.
   * `/images/releases/from-coffee-to-frequencies-v1.webp`). Vacío = asset
   * pendiente: el componente usa el fallback editorial de temporada.
   */
  coverImage: string;
  /** URL de Spotify opcional (se abre en pestaña nueva, rel=noreferrer). */
  spotifyUrl?: string;
  /** URL de compra futura (Mercado Pago u otro canal autorizado). */
  purchaseUrl?: string;
  /** Disponibilidad de compra: hasta que exista canal, siempre «unavailable». */
  purchaseStatus: PurchaseStatus;
}

export const RELEASES: readonly Release[] = [
  {
    id: 'from-coffee-to-frequencies',
    title: 'From Coffee to Frequencies',
    kind: 'Álbum · último',
    date: '2026',
    season: 'cosecha',
    formats: 'Digital · Beatport',
    trackId: 'coherencia-432',
    price: 'COP 18.000',
    coverImage: '/images/releases/from-coffee-to-frequencies.webp',
    spotifyUrl: 'https://open.spotify.com/album/2LB9Dh1bQtIygRPqPMalRe',
    purchaseStatus: 'unavailable',
  },
  {
    id: 'coffee-in-frequencies',
    title: 'Coffee in Frequencies',
    kind: 'Álbum',
    date: '2026',
    season: 'floracion',
    formats: 'Digital · Vinilo translúcido',
    trackId: 'expansion-432',
    price: 'COP 18.000',
    coverImage: '/images/releases/coffee-in-frequencies.webp',
    spotifyUrl: 'https://open.spotify.com/album/3QORX6JtWw22nwDNMy9jLp',
    purchaseStatus: 'unavailable',
  },
  {
    id: 'tueste-selection',
    title: 'Tueste Selection',
    kind: 'EP',
    date: '2026',
    season: 'germinacion',
    formats: 'Digital',
    trackId: 'raiz-222',
    price: 'COP 18.000',
    coverImage: '/images/releases/tueste-selection.webp',
    spotifyUrl: 'https://open.spotify.com/album/33rpXDbvGX7XtJbfzXvxct',
    purchaseStatus: 'unavailable',
  },
  {
    id: 'tostion',
    title: 'Tostión',
    kind: 'EP · Live Ritual',
    date: 'Próximamente',
    season: 'tostion',
    formats: 'Grabado en finca',
    trackId: 'despertar-528',
    price: '',
    coverImage: '/images/releases/tostion.webp',
    purchaseStatus: 'unavailable',
  },
];

export function getRelease(id: string): Release | undefined {
  return RELEASES.find((r) => r.id === id);
}
