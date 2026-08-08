import type { TrackId } from '@/lib/audio';
import AudioPlayer from './AudioPlayer';
import Registros from './Registros';
import styles from './Frecuencias.module.css';

export interface FrecuenciasProps {
  /** Pista seleccionada actualmente (compartida con la sección Origen). */
  selectedId: TrackId;
  /** Cambia la pista seleccionada. */
  onSelect: (id: TrackId) => void;
  /** Se dispara al pulsar el botón principal del deck. */
  onPlay: () => void;
  /** Mensaje accesible a anunciar (aria-live). */
  mensaje: string | null;
}

/**
 * Sección «Escucha el origen» · reproductor visual de Origen Tostado.
 * Replica la estructura del mockup: acto, encabezado, player y registros.
 * El estado de la pista seleccionada llega por props desde
 * ListeningExperience, que lo comparte con la sección Origen.
 */
export default function Frecuencias({ selectedId, onSelect, onPlay, mensaje }: FrecuenciasProps) {
  return (
    <section id="frecuencias" className={styles.section} aria-labelledby="frec-titulo">
      <p className={styles.acto}>Acto I · El territorio suena</p>
      <div className={styles.sechead}>
        <span className={styles.secnum}>01 / FRECUENCIAS</span>
      </div>
      <h2 id="frec-titulo" className={styles.title}>
        Escucha el <em>origen</em>
      </h2>
      <p className={styles.lead}>
        Cada pieza nace de una finca real. Agua, viento, cerezas, tostión, máquinas y voces de
        productores se convierten en frecuencia. Pulsa play y deja que el café suene.
      </p>

      <AudioPlayer selectedId={selectedId} onSelect={onSelect} onPlay={onPlay} mensaje={mensaje} />

      <Registros />
    </section>
  );
}
