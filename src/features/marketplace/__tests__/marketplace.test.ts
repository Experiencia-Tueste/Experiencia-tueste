import { describe, expect, it } from 'vitest';
import {
  getArtist,
  getListing,
  liveListings,
  markSold,
  reserveListing,
  SEED_ARTISTS,
  SEED_LISTINGS,
} from '../index';

describe('feature marketplace', () => {
  it('expone perfiles y listings del mockup', () => {
    expect(SEED_ARTISTS).toHaveLength(3);
    expect(getArtist('art-1')?.name).toBe('María Cántara');
    expect(getListing('l1')?.price).toBe(95000);
  });

  it('lista solo piezas en vivo de un artista', () => {
    expect(liveListings('art-1').map((l) => l.id)).toEqual(['l1']);
    expect(liveListings('art-2')).toEqual([]);
  });

  it('reserva una pieza en vivo', () => {
    const listings = reserveListing(SEED_LISTINGS, 'l1');
    expect(listings.find((l) => l.id === 'l1')?.status).toBe('reserved');
  });

  it('no reserva una pieza ya vendida', () => {
    const listings = reserveListing(SEED_LISTINGS, 'l3');
    expect(listings.find((l) => l.id === 'l3')?.status).toBe('sold');
  });

  it('marca como vendida una pieza reservada', () => {
    const listings = markSold(SEED_LISTINGS, 'l2');
    expect(listings.find((l) => l.id === 'l2')?.status).toBe('sold');
  });
});
