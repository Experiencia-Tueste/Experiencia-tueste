import { describe, expect, it } from 'vitest';
import { getChannel, getTrack, nextInQueue, RADIO_CHANNELS, TRACKS } from '../index';

describe('feature audio', () => {
  it('expone el catálogo de pistas con frecuencias rituales', () => {
    expect(TRACKS).toHaveLength(5);
    expect(TRACKS.map((t) => t.hz)).toEqual([111, 222, 432, 432, 528]);
  });

  it('las pistas no embeben audio en base64 (src vacío hasta CDN)', () => {
    for (const t of TRACKS) {
      expect(t.src).toBe('');
      expect(t.src.startsWith('data:')).toBe(false);
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
