import styles from './SectionGhost.module.css';

export interface SectionGhostProps {
  /** Número de la sección, p. ej. «01». */
  number: string;
  /** Lado del número fantasma: final (derecha) o inicio (izquierda). */
  side?: 'start' | 'end';
}

/**
 * Número fantasma de sección (paridad visual del mockup): un numeral
 * gigante en serif itálica con trazo tenue que vive detrás del contenido.
 * Es puramente decorativo: aria-hidden, pointer-events none y fuera del
 * flujo. El contenido de la sección queda por encima sin z-index
 * negativos (el fantasma usa z-index 0 y el contenido se eleva a 1).
 */
export default function SectionGhost({ number, side = 'end' }: SectionGhostProps) {
  return (
    <span
      className={`${styles.ghost} ${side === 'start' ? styles.start : styles.end}`}
      data-section-ghost={number}
      aria-hidden="true"
    >
      {number}
    </span>
  );
}
