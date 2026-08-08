/**
 * Feature: audio
 * ---------------------------------------------------------------------
 * Reproductor único de Origen Tostado + señales de radio.
 *
 * Regla del plan: el audio embebido en base64 de los mockups NO se migra.
 * Las pistas se sirven por URL (Supabase Storage / CDN) cuando exista
 * contenido real. Aquí se define el contrato de datos y la lógica pura
 * (colas de reproducción, señales) sin tocar el DOM.
 */

import type { TrackId } from '../../lib/audio';

export type TrackMode = 'ambient' | 'house';

export interface Track {
  id: TrackId;
  title: string;
  description: string;
  /** Frecuencia ritual en Hz (111, 222, 432, 528…). */
  hz: number;
  mode: TrackMode;
  /** URL del audio. Vacío = aún sin asset en CDN. */
  src: string;
  /** Duración en segundos (0 si se desconoce). */
  duration: number;
}

export type RadioChannelId = 'origen' | 'cafe' | 'hotel' | 'rest' | 'tienda';

export interface RadioChannel {
  id: RadioChannelId;
  name: string;
  /** Cola de pistas por id, en orden de reproducción. */
  queue: TrackId[];
}

export interface PlayerState {
  currentTrackId: TrackId | null;
  playing: boolean;
  /** 'file' cuando hay URL real, 'synth' como fallback de demo. */
  mode: 'file' | 'synth';
  channel: RadioChannelId | null;
}

const TRACK_SEED: Array<Omit<Track, 'src' | 'duration'>> = [
  {
    id: 'origen-111',
    title: 'Origen 111 Hz',
    description: 'Frecuencia raíz · FX',
    hz: 111,
    mode: 'ambient',
  },
  {
    id: 'raiz-222',
    title: 'Raíz 222 Hz',
    description: 'Tierra y origen · FX',
    hz: 222,
    mode: 'ambient',
  },
  {
    id: 'expansion-432',
    title: 'Expansión 432 Hz',
    description: 'Apertura y aire · FX',
    hz: 432,
    mode: 'ambient',
  },
  {
    id: 'coherencia-432',
    title: 'Coherencia 432 Hz',
    description: 'Equilibrio · keyboard',
    hz: 432,
    mode: 'house',
  },
  {
    id: 'despertar-528',
    title: 'Despertar 528 Hz',
    description: 'Transformación',
    hz: 528,
    mode: 'house',
  },
];

/**
 * Catálogo de pistas (datos de demo; src vacío hasta activar CDN).
 * Los previews de 75 s de los mockups se reemplazan por URLs reales.
 */
export const TRACKS: Track[] = TRACK_SEED.map((t) => ({
  ...t,
  src: '',
  duration: 222,
}));

/** Señales de radio (demo). */
export const RADIO_CHANNELS: RadioChannel[] = [
  {
    id: 'origen',
    name: 'Señal Origen',
    queue: ['origen-111', 'expansion-432', 'raiz-222', 'despertar-528', 'coherencia-432'],
  },
  {
    id: 'cafe',
    name: 'Café de especialidad',
    queue: ['expansion-432', 'raiz-222', 'coherencia-432', 'origen-111', 'despertar-528'],
  },
  { id: 'hotel', name: 'Hotel & spa', queue: ['origen-111', 'raiz-222', 'expansion-432'] },
  {
    id: 'rest',
    name: 'Restaurante',
    queue: ['coherencia-432', 'despertar-528', 'expansion-432', 'raiz-222'],
  },
  {
    id: 'tienda',
    name: 'Tienda & galería',
    queue: ['raiz-222', 'expansion-432', 'origen-111', 'despertar-528'],
  },
];

export function getTrack(id: TrackId): Track | undefined {
  return TRACKS.find((t) => t.id === id);
}

export function getChannel(id: RadioChannelId): RadioChannel | undefined {
  return RADIO_CHANNELS.find((c) => c.id === id);
}

/** Siguiente pista de una cola (avance circular). */
export function nextInQueue(channel: RadioChannel, currentId: TrackId): Track | undefined {
  const idx = channel.queue.indexOf(currentId);
  const next = channel.queue[(idx + 1) % channel.queue.length];
  return getTrack(next);
}
