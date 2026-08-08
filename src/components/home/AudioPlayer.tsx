'use client';

import { TRACKS } from '@/features/audio';
import type { AudioPlayerResult } from '@/hooks/useAudioPlayer';
import Deck from './Deck';
import RadioDemo from './RadioDemo';
import TrackList from './TrackList';
import styles from './AudioPlayer.module.css';

export interface AudioPlayerProps {
  /** Estado y controles del reproductor (hook useAudioPlayer). */
  player: AudioPlayerResult;
}

/** Formatea segundos como m:ss (0:00 si no hay duración). */
function fmt(t: number): string {
  if (!Number.isFinite(t) || t <= 0) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Reproductor de Origen Tostado. Componente controlado por el hook
 * useAudioPlayer (único HTMLAudioElement + grafo de audio): el deck
 * alterna play/pausa, la lista selecciona pista, el demo de radio elige
 * señal encadenada y el scrub busca dentro del preview. El área aria-live
 * anuncia errores y mensajes del hook.
 */
export default function AudioPlayer({ player }: AudioPlayerProps) {
  const {
    trackId,
    playing,
    loading,
    error,
    currentTime,
    duration,
    analyser,
    channelId,
    mensaje,
    hasInteracted,
    togglePlay,
    select,
    seek,
    selectChannel,
  } = player;

  const selected = TRACKS.find((t) => t.id === trackId);
  const max = duration > 0 ? duration : 1;
  const value = Math.min(currentTime, max);

  return (
    <div className={styles.player}>
      <Deck
        track={selected}
        playing={playing}
        loading={loading}
        analyser={analyser}
        hasInteracted={hasInteracted}
        onTogglePlay={togglePlay}
      />

      <div className={styles.col}>
        <div className={styles.now}>Reproduciendo ahora</div>
        <TrackList tracks={TRACKS} selectedId={trackId} playing={playing} onSelect={select} />

        <p className={styles.note} data-note>
          Fragmentos de 75 s · las piezas completas viven en{' '}
          <a href="#lanzamientos">la discografía</a> y en tus plataformas.
        </p>

        <RadioDemo channelId={channelId} onSelectChannel={selectChannel} mensaje={mensaje} />

        <div className={styles.scrub} data-scrub>
          <div className={styles.bar} aria-hidden="true">
            <div
              className={styles.fill}
              style={{
                inset: `0 ${100 - (duration > 0 ? (currentTime / duration) * 100 : 0)}% 0 0`,
              }}
            />
          </div>
          <input
            type="range"
            className={styles.range}
            min={0}
            max={max}
            step={0.1}
            value={value}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Progreso de la pista"
            disabled={duration <= 0}
          />
          <div className={styles.times}>
            <span>{fmt(currentTime)}</span>
            <span>{duration > 0 ? fmt(duration) : '—'}</span>
          </div>
        </div>

        <p className={styles.liveNote} data-live role="status" aria-live="polite">
          {error ?? mensaje ?? '\u00A0'}
        </p>
      </div>
    </div>
  );
}
