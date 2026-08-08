import type { AudioPlayerResult } from '@/hooks/useAudioPlayer';
import AudioPlayer from './AudioPlayer';
import Registros from './Registros';
import Reveal from './Reveal';
import SectionGhost from './SectionGhost';
import styles from './Frecuencias.module.css';

export interface FrecuenciasProps {
  /** Estado y controles del reproductor (hook useAudioPlayer). */
  player: AudioPlayerResult;
}

/**
 * Sección «Escucha el origen» · reproductor de Origen Tostado.
 * Replica la estructura del mockup: acto, encabezado, player y registros.
 * El estado completo del reproductor (pista, play, radio encadenada)
 * viene del hook useAudioPlayer a través de ListeningExperience, que lo
 * comparte con Origen, Lanzamientos, Barista Sonoro y Radio Origen.
 */
export default function Frecuencias({ player }: FrecuenciasProps) {
  return (
    <section id="frecuencias" className={styles.section} aria-labelledby="frec-titulo">
      <SectionGhost number="01" />
      <Reveal>
        <p className={styles.acto}>Acto I · El territorio suena</p>
      </Reveal>
      <Reveal>
        <div className={styles.sechead}>
          <span className={styles.secnum}>01 / FRECUENCIAS</span>
        </div>
      </Reveal>
      <Reveal>
        <h2 id="frec-titulo" className={styles.title}>
          Escucha el <em>origen</em>
        </h2>
      </Reveal>
      <Reveal>
        <p className={styles.lead}>
          Cada pieza nace de una finca real. Agua, viento, cerezas, tostión, máquinas y voces de
          productores se convierten en frecuencia. Pulsa play y deja que el café suene.
        </p>
      </Reveal>

      <AudioPlayer player={player} />

      <Reveal>
        <Registros />
      </Reveal>
    </section>
  );
}
