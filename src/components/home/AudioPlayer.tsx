'use client';

import { TRACKS } from '@/features/audio';
import type { TrackId } from '@/lib/audio';
import Deck from './Deck';
import TrackList from './TrackList';
import styles from './AudioPlayer.module.css';

export interface AudioPlayerProps {
  /** Pista seleccionada actualmente (compartida con la sección Origen). */
  selectedId: TrackId;
  /** Cambia la pista seleccionada. */
  onSelect: (id: TrackId) => void;
  /** Se dispara al pulsar el botón principal del deck. */
  onPlay: () => void;
  /** Mensaje accesible a anunciar (aria-live), p. ej. «Audio disponible próximamente». */
  mensaje: string | null;
}

/**
 * Reproductor visual de Origen Tostado. Componente controlado: recibe la
 * pista seleccionada por props desde ListeningExperience (que comparte el
 * estado con la sección Origen). No carga ni embebe audio real:
 * TRACKS.src está vacío hasta activar el CDN. Si el usuario intenta
 * reproducir, el padre anuncia un mensaje en un área aria-live; no se
 * simula reproducción.
 */
export default function AudioPlayer({ selectedId, onSelect, onPlay, mensaje }: AudioPlayerProps) {
  const selected = TRACKS.find((t) => t.id === selectedId);

  return (
    <div className={styles.player}>
      <Deck track={selected} onPlay={onPlay} />

      <div className={styles.col}>
        <div className={styles.now}>Reproduciendo ahora</div>
        <TrackList tracks={TRACKS} selectedId={selectedId} onSelect={onSelect} />

        <div className={styles.scrub} aria-hidden="true">
          <div className={styles.bar}>
            <div className={styles.fill} />
          </div>
          <div className={styles.times}>
            <span>0:00</span>
            <span>—</span>
          </div>
        </div>

        <p className={styles.note}>
          Fragmentos de 75 s · las piezas completas viven en la discografía y en tus plataformas.
        </p>

        <p className={styles.liveNote} role="status" aria-live="polite">
          {mensaje ?? '\u00A0'}
        </p>
      </div>
    </div>
  );
}
