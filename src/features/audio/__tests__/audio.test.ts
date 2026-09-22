import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getChannel, getTrack, nextInQueue, RADIO_CHANNELS, TRACK_SRC, TRACKS } from '../index';

/** public/ de la raíz del proyecto, relativo a este archivo de test. */
const PUBLIC_URL = new URL('../../../../public/', import.meta.url);

describe('feature audio', () => {
  it('expone el catálogo de pistas con frecuencias rituales', () => {
    expect(TRACKS).toHaveLength(5);
    expect(TRACKS.map((t) => t.hz)).toEqual([111, 222, 432, 432, 528]);
  });

  it('mapea cada pista a un master WAV estático', () => {
    expect(TRACK_SRC).toEqual({
      'origen-111': '/audio/01-origen-111-hz.wav',
      'raiz-222': '/audio/02-raiz-222-hz.wav',
      'expansion-432': '/audio/03-expansion-432-hz.wav',
      'coherencia-432': '/audio/03-expansion-432-hz.wav',
      'despertar-528': '/audio/05-despertar-528-hz.wav',
    });
    for (const t of TRACKS) {
      expect(t.src).toBe(TRACK_SRC[t.id]);
    }
  });

  it('las rutas son archivos WAV locales, no datos embebidos ni URL externa', () => {
    for (const t of TRACKS) {
      expect(t.src.startsWith('data:')).toBe(false);
      expect(t.src).not.toContain('base64');
      expect(t.src).not.toMatch(/^https?:\/\//);
      expect(t.src).toMatch(/^\/audio\/.+\.wav$/);
      expect(t.duration).toBeGreaterThan(75.05);
    }
  });

  it('cada ruta corresponde a un archivo WAV existente en public/audio', () => {
    for (const t of TRACKS) {
      const file = new URL(t.src.replace(/^\/audio\//, 'audio/'), PUBLIC_URL);
      expect(existsSync(file), `falta el archivo ${t.src}`).toBe(true);
    }
  });

  it('el catálogo no contiene el texto accidental "keyboard"', () => {
    const catalogText = TRACKS.map((t) => `${t.title} ${t.description}`).join(' ');
    expect(catalogText.toLowerCase()).not.toContain('keyboard');
  });

  it('busca una pista por id', () => {
    expect(getTrack('despertar-528')?.title).toBe('Despertar 528 Hz');
    expect(getTrack('no-existe')).toBeUndefined();
  });

  it('avanza de forma circular dentro de una señal', () => {
    const ch = getChannel('origen')!;
    expect(nextInQueue(ch, 'origen-111')?.id).toBe('expansion-432');
    expect(nextInQueue(ch, 'coherencia-432')?.id).toBe('origen-111');
  });

  it('todas las señales referencian pistas existentes', () => {
    for (const ch of RADIO_CHANNELS) {
      for (const id of ch.queue) {
        expect(getTrack(id), `señal ${ch.id} -> pista ${id}`).toBeDefined();
      }
    }
  });
});
