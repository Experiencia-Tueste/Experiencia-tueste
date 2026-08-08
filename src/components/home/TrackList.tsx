import type { Track } from '@/features/audio';
import type { TrackId } from '@/lib/audio';
import styles from './TrackList.module.css';

/**
 * Lista de pistas del reproductor. Consume el contrato de
 * src/features/audio (TRACKS) sin modificar su lógica. La pista
 * seleccionada cambia visualmente; cada fila es un botón real.
 */
export default function TrackList({
  tracks,
  selectedId,
  onSelect,
}: {
  tracks: Track[];
  selectedId: TrackId;
  onSelect: (id: TrackId) => void;
}) {
  return (
    <div className={styles.list}>
      {tracks.map((t, i) => {
        const active = t.id === selectedId;
        return (
          <button
            key={t.id}
            type="button"
            className={`${styles.track}${active ? ` ${styles.active}` : ''}`}
            onClick={() => onSelect(t.id)}
            aria-pressed={active}
          >
            <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
            <span className={styles.bars} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className={styles.info}>
              <b>{t.title}</b>
              <span>{t.description}</span>
            </span>
            <span className={`${styles.tag}${t.mode === 'house' ? ` ${styles.tagPista}` : ''}`}>
              {t.mode === 'house' ? 'Pista' : 'Escucha'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
