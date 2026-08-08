import { describe, expect, it } from 'vitest';
import { getRelease, RELEASES } from '../index';
import { getTrack } from '../../audio';

describe('feature music', () => {
  it('expone los cuatro lanzamientos del mockup', () => {
    expect(RELEASES.map((r) => r.title)).toEqual([
      'From Coffee to Frequencies',
      'Coffee in Frequencies',
      'Tueste Selection',
      'Tostión',
    ]);
  });

  it('cada lanzamiento referencia una pista existente del catálogo', () => {
    for (const rel of RELEASES) {
      expect(
        getTrack(rel.trackId),
        `lanzamiento ${rel.title} -> pista ${rel.trackId}`,
      ).toBeDefined();
    }
  });

  it('los lanzamientos publicados tienen precio y URL de Spotify', () => {
    const out = RELEASES.filter((r) => r.status === 'out');
    expect(out).toHaveLength(3);
    for (const rel of out) {
      expect(rel.price).not.toBe('');
      expect(rel.spotify).toMatch(/^https:\/\/open\.spotify\.com\//);
    }
  });

  it('el lanzamiento próximo no tiene precio ni URL de Spotify', () => {
    const soon = RELEASES.filter((r) => r.status === 'soon');
    expect(soon).toHaveLength(1);
    expect(soon[0].title).toBe('Tostión');
    expect(soon[0].price).toBe('');
    expect(soon[0].spotify).toBe('');
  });

  it('busca un lanzamiento por id', () => {
    expect(getRelease('tostion')?.title).toBe('Tostión');
    expect(getRelease('no-existe')).toBeUndefined();
  });
});
