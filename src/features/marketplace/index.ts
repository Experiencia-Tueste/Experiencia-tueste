/**
 * Feature: marketplace
 * ---------------------------------------------------------------------
 * Marketplace de artistas y productores: perfiles, obras y compras.
 *
 * Regla del plan: las transacciones del marketplace se procesan con
 * escrow (el pago se libera cuando el comprador confirma la recepción).
 * Aquí está el contrato de tipos y la lógica pura de estados.
 */

export type MarketplaceStatus = 'live' | 'sold' | 'reserved';

export interface ArtistProfile {
  id: string;
  name: string;
  handle: string;
  bio: string;
  /** Ícono del mockup (vinyl, cassette, cup, tee, print, coffee). */
  avatar: string;
  location: string;
}

export interface Listing {
  id: string;
  artistId: string;
  title: string;
  description: string;
  price: number;
  status: MarketplaceStatus;
  createdAt: string;
}

/** Perfiles de ejemplo (datos del mockup). */
export const SEED_ARTISTS: ArtistProfile[] = [
  {
    id: 'art-1',
    name: 'María Cántara',
    handle: '@maria.cantara',
    bio: 'Ceramista. Cada taza sale del torno con la misma paciencia que un tueste lento.',
    avatar: 'cup',
    location: 'Salento, Quindío',
  },
  {
    id: 'art-2',
    name: 'Diego Ríos',
    handle: '@diego.rios',
    bio: 'Productor y grabador de campo. Captura el sonido de las fincas antes del primer crack.',
    avatar: 'vinyl',
    location: 'Pijao, Quindío',
  },
  {
    id: 'art-3',
    name: 'Lina Torres',
    handle: '@lina.torres',
    bio: 'Serigrafía textil con tintas a base de agua. El sol Tueste es su firma.',
    avatar: 'tee',
    location: 'Armenia, Quindío',
  },
];

export const SEED_LISTINGS: Listing[] = [
  {
    id: 'l1',
    artistId: 'art-1',
    title: 'Taza Cántara · Edición 1/1',
    description: 'Gres esmaltado a mano. La pieza que abre la colección.',
    price: 95000,
    status: 'live',
    createdAt: '2026-07-20',
  },
  {
    id: 'l2',
    artistId: 'art-2',
    title: 'Field Tapes · Tostión',
    description: 'Cinta original con el registro de tostión del Lote 000.',
    price: 78000,
    status: 'reserved',
    createdAt: '2026-07-22',
  },
  {
    id: 'l3',
    artistId: 'art-3',
    title: 'Camiseta Origen · Talla M',
    description: 'Serigrafía del sol Tueste sobre algodón orgánico.',
    price: 119000,
    status: 'sold',
    createdAt: '2026-07-18',
  },
];

export function getArtist(id: string): ArtistProfile | undefined {
  return SEED_ARTISTS.find((a) => a.id === id);
}

export function getListing(id: string): Listing | undefined {
  return SEED_LISTINGS.find((l) => l.id === id);
}

/** Listings en vivo de un artista. */
export function liveListings(artistId: string): Listing[] {
  return SEED_LISTINGS.filter((l) => l.artistId === artistId && l.status === 'live');
}

/** Reserva una pieza (estado intermedio antes de la compra). */
export function reserveListing(listings: Listing[], listingId: string): Listing[] {
  return listings.map((l) =>
    l.id === listingId && l.status === 'live' ? { ...l, status: 'reserved' } : l,
  );
}

/** Marca como vendida (solo si estaba reservada o en vivo). */
export function markSold(listings: Listing[], listingId: string): Listing[] {
  return listings.map((l) =>
    l.id === listingId && l.status !== 'sold' ? { ...l, status: 'sold' } : l,
  );
}
