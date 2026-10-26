/**
 * Feature: audio
 * ---------------------------------------------------------------------
 * Reproductor único de Origen Tostado + señales de radio.
 *
 * Contrato de medios: el audio pesado NO vive en el repo ni en Postgres.
 * Se sirve como objeto público desde Supabase Storage (bucket `radio`), con
 * range requests y caché de CDN. El navegador no descarga nada hasta que la
 * persona pulsa reproducir.
 *
 * - `src`    → master comprimido en Opus (streaming ligero, ~3-5 MB).
 * - `master` → WAV lossless, para descarga opcional (no lo usa el player).
 *
 * La URL base se arma con `NEXT_PUBLIC_SUPABASE_URL` (ya es build arg del
 * Dockerfile) y el bucket público. Sin Supabase configurado (p. ej. modo
 * demo), cae a `/audio` local para que el desarrollo siga funcionando.
 */

import { publicSupabaseUrl } from '@/lib/config/env-public';

import type { TrackId } from '../../lib/audio';

export type TrackMode = 'ambient' | 'house';

export interface Track {
  id: TrackId;
  title: string;
  description: string;
  /** Frecuencia ritual en Hz (111, 222, 432, 528…). */
  hz: number;
  mode: TrackMode;
  /** Master Opus servido bajo demanda (streaming). */
  src: string;
  /** Master WAV lossless para descarga opcional. */
  master: string;
  /** Duración estimada del master; el elemento audio confirma su metadata. */
  duration: number;
}

export type RadioChannelId = 'origen' | 'cafe' | 'hotel' | 'rest' | 'tienda';

export interface RadioChannel {
  id: RadioChannelId;
  name: string;
  /** Cola de pistas por id, en orden de reproducción. */
  queue: TrackId[];
}

/** Bucket público de Supabase Storage donde viven los masters de audio. */
export const AUDIO_BUCKET = 'radio';

/**
 * Base de las URLs de audio. Con Supabase configurado, apunta al bucket
 * público (`.../storage/v1/object/public/radio`), estable y cacheable. Sin
 * Supabase (modo demo/dev), cae a `/audio` local. `NEXT_PUBLIC_*` se
 * reemplaza en build, así que esto se resuelve en el bundle del cliente.
 */
function resolveAudioBase(): string {
  const supabaseUrl = publicSupabaseUrl();
  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/${AUDIO_BUCKET}`;
  }
  return '/audio';
}

export const AUDIO_BASE = resolveAudioBase();

/**
 * Nombre base del archivo de cada pista (sin extensión). Coherencia comparte
 * el master de 432 Hz hasta que exista una pieza dedicada para esa señal.
 */
const AUDIO_FILE: Record<TrackId, string> = {
  'origen-111': '01-origen-111-hz',
  'raiz-222': '02-raiz-222-hz',
  'expansion-432': '03-expansion-432-hz',
  'coherencia-432': '03-expansion-432-hz',
  'despertar-528': '05-despertar-528-hz',
};

/** URL del master Opus (streaming) de cada pista. */
export const TRACK_SRC: Record<TrackId, string> = Object.fromEntries(
  Object.entries(AUDIO_FILE).map(([id, file]) => [id, `${AUDIO_BASE}/${file}.opus`]),
) as Record<TrackId, string>;

/** URL del master WAV lossless (descarga opcional) de cada pista. */
export const TRACK_MASTER: Record<TrackId, string> = Object.fromEntries(
  Object.entries(AUDIO_FILE).map(([id, file]) => [id, `${AUDIO_BASE}/${file}.wav`]),
) as Record<TrackId, string>;

const TRACK_SEED: Array<Omit<Track, 'src' | 'master' | 'duration'>> = [
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
 * Catálogo de masters locales. La duración es informativa hasta que el
 * navegador reciba `loadedmetadata` del archivo WAV.
 */
export const TRACKS: Track[] = TRACK_SEED.map((t) => ({
  ...t,
  src: TRACK_SRC[t.id],
  master: TRACK_MASTER[t.id],
  duration:
    t.id === 'origen-111'
      ? 241.625
      : t.id === 'raiz-222'
        ? 149.625
        : t.id === 'despertar-528'
          ? 206.875
          : 205.625,
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
