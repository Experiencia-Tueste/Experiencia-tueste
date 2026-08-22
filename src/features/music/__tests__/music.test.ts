import { existsSync } from 'node:fs';
import { join } from 'node:path';
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
    const conPrecio = RELEASES.filter((r) => r.price !== '');
    expect(conPrecio).toHaveLength(3);
    for (const rel of conPrecio) {
      expect(rel.spotifyUrl).toMatch(/^https:\/\/open\.spotify\.com\//);
    }
  });

  it('el lanzamiento próximo no tiene precio ni URL de Spotify', () => {
    const proximo = RELEASES.filter((r) => r.price === '');
    expect(proximo).toHaveLength(1);
    expect(proximo[0].title).toBe('Tostión');
    expect(proximo[0].spotifyUrl).toBeUndefined();
  });

  it('la compra está marcada como no disponible hasta que exista un canal de pago', () => {
    expect(RELEASES.length).toBeGreaterThan(0);
    for (const rel of RELEASES) {
      expect(rel.purchaseStatus).toBe('unavailable');
      expect(rel.purchaseUrl).toBeUndefined();
    }
  });

  it('las cuatro portadas usan las rutas exactas de assets locales existentes', () => {
    const esperado: Record<string, string> = {
      'from-coffee-to-frequencies': '/images/releases/from-coffee-to-frequencies.webp',
      'coffee-in-frequencies': '/images/releases/coffee-in-frequencies.webp',
      'tueste-selection': '/images/releases/tueste-selection.webp',
      tostion: '/images/releases/tostion.webp',
    };

    for (const rel of RELEASES) {
      expect(rel.coverImage).toBe(esperado[rel.id]);
      expect(rel.coverImage).toMatch(/^\/images\/releases\//);
      expect(rel.coverImage).not.toMatch(/^https?:\/\//);
      expect(rel.coverImage).not.toMatch(/^data:/);
      // El archivo debe existir físicamente (fuente local aprobada).
      expect(
        existsSync(join(process.cwd(), 'public', rel.coverImage)),
        `asset local faltante: ${rel.coverImage}`,
      ).toBe(true);
    }
  });

  it('busca un lanzamiento por id', () => {
    expect(getRelease('tostion')?.title).toBe('Tostión');
    expect(getRelease('no-existe')).toBeUndefined();
  });
});
