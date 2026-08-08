/**
 * Feature: audio
 * ---------------------------------------------------------------------
 * Reproductor único de Origen Tostado + señales de radio.
 *
 * Contrato: las pistas son previews MP3 locales reales servidos por la
 * propia app desde public/audio (75.05 s). No hay base64, ni CDN
 * pendiente, ni síntesis artificial: el ciclo de vida del navegador
 * (Audio, AudioContext, AnalyserNode, canvas) vive en el hook cliente
 * useAudioPlayer; aquí solo hay lógica pura: catálogo, rutas, colas y
 * señales.
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
  /** URL del preview MP3 local (public/audio). */
  src: string;
  /** Duración en segundos de los previews (75.05). */
  duration: number;
}

export type RadioChannelId = 'origen' | 'cafe' | 'hotel' | 'rest' | 'tienda';

export interface RadioChannel {
  id: RadioChannelId;
  name: string;
  /** Cola de pistas por id, en orden de reproducción. */
  queue: TrackId[];
}

/**
 * Rutas literales de los previews MP3 en public/audio. Mapa explícito y
 * determinista TrackId → src: los nombres de archivo reales llevan
 * prefijo numérico y sufijo -hz, por lo que NO se derivan del id.
 */
export const TRACK_SRC: Record<TrackId, string> = {
  'origen-111': '/audio/01-origen-111-hz.mp3',
  'raiz-222': '/audio/02-raiz-222-hz.mp3',
  'expansion-432': '/audio/03-expansion-432-hz.mp3',
  'coherencia-432': '/audio/04-coherencia-432-hz.mp3',
  'despertar-528': '/audio/05-despertar-528-hz.mp3',
};

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
    description: 'Equilibrio',
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
 * Catálogo de pistas con previews MP3 locales (public/audio).
 * Duración real de los previews: 75.05 s. Sin base64 ni URLs externas.
 */
export const TRACKS: Track[] = TRACK_SEED.map((t) => ({
  ...t,
  src: TRACK_SRC[t.id],
  duration: 75.05,
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

/* ── Demo de radio (paridad visual del mockup) ───────────────────────── */

export interface RadioDemoOption {
  /** Identificador estable de la opción ('' = escucha libre). */
  id: 'libre' | RadioChannelId;
  /** Etiqueta visible del chip. */
  label: string;
  /** Canal de la señal (null = escucha libre, pista inicial). */
  channel: RadioChannelId | null;
}

/**
 * Opciones del demo de radio, centralizadas aquí para que el componente
 * no duplique arrays. Cada señal apunta a su canal; «Escucha libre» no
 * tiene canal y usa la pista inicial del catálogo.
 */
export const RADIO_DEMO_OPTIONS: RadioDemoOption[] = [
  { id: 'libre', label: 'Escucha libre', channel: null },
  { id: 'origen', label: 'Señal Origen', channel: 'origen' },
  { id: 'cafe', label: 'Café', channel: 'cafe' },
  { id: 'hotel', label: 'Hotel & spa', channel: 'hotel' },
  { id: 'rest', label: 'Restaurante', channel: 'rest' },
  { id: 'tienda', label: 'Tienda', channel: 'tienda' },
];

/** Primera pista de la señal elegida (o la pista inicial en escucha libre). */
export function radioDemoTrackId(option: RadioDemoOption): TrackId {
  if (option.channel === null) return TRACKS[0].id;
  return getChannel(option.channel)?.queue[0] ?? TRACKS[0].id;
}
