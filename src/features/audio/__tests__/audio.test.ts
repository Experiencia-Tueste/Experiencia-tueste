import { describe, expect, it, vi } from 'vitest';
import {
  AUDIO_BASE,
  getChannel,
  getTrack,
  nextInQueue,
  RADIO_CHANNELS,
  TRACK_MASTER,
  TRACK_SRC,
  TRACKS,
} from '../index';

describe('feature audio', () => {
  it('expone el catálogo de pistas con frecuencias rituales', () => {
    expect(TRACKS).toHaveLength(5);
    expect(TRACKS.map((t) => t.hz)).toEqual([111, 222, 432, 432, 528]);
  });

  it('sin Supabase configurado, la base de audio cae a /audio (modo demo)', () => {
    // El entorno de test no define NEXT_PUBLIC_SUPABASE_URL.
    expect(AUDIO_BASE).toBe('/audio');
  });

  it('mapea cada pista a un master Opus (streaming) y su WAV lossless', () => {
    expect(TRACK_SRC).toEqual({
      'origen-111': '/audio/01-origen-111-hz.opus',
      'raiz-222': '/audio/02-raiz-222-hz.opus',
      'expansion-432': '/audio/03-expansion-432-hz.opus',
      'coherencia-432': '/audio/03-expansion-432-hz.opus',
      'despertar-528': '/audio/05-despertar-528-hz.opus',
    });
    for (const t of TRACKS) {
      expect(t.src).toBe(TRACK_SRC[t.id]);
      expect(t.master).toBe(TRACK_MASTER[t.id]);
      // src (Opus) y master (WAV) comparten el mismo nombre base.
      expect(t.master).toBe(t.src.replace(/\.opus$/, '.wav'));
    }
  });

  it('el src es Opus y el master WAV, nunca datos embebidos', () => {
    for (const t of TRACKS) {
      expect(t.src.startsWith('data:')).toBe(false);
      expect(t.src).not.toContain('base64');
      expect(t.src).toMatch(/\.opus$/);
      expect(t.master).toMatch(/\.wav$/);
      expect(t.duration).toBeGreaterThan(75.05);
    }
  });

  it('con Supabase configurado, la base apunta al bucket público (via módulo aislado)', async () => {
    const prev = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://proyecto.supabase.co';
    try {
      vi.resetModules();
      const fresh = await import('../index');
      expect(fresh.AUDIO_BASE).toBe('https://proyecto.supabase.co/storage/v1/object/public/radio');
      expect(fresh.TRACK_SRC['origen-111']).toBe(
        'https://proyecto.supabase.co/storage/v1/object/public/radio/01-origen-111-hz.opus',
      );
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      else process.env.NEXT_PUBLIC_SUPABASE_URL = prev;
      vi.resetModules();
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
