import Reveal from './Reveal';
import styles from './Manifiesto.module.css';

/**
 * Manifiesto de marca (contenido exacto del documento maestro).
 * Sin JavaScript de animaciones heredado del HTML; solo CSS con
 * prefers-reduced-motion respetado. Semántica: `del` para el tachado
 * de «no acompaña» y `em` para el énfasis de «nace».
 */
export default function Manifiesto() {
  return (
    <section id="manifiesto" className={styles.manifiesto} aria-labelledby="manifiesto-title">
      <Reveal>
        <h2 id="manifiesto-title" className={styles.kicker}>
          Manifiesto
        </h2>
      </Reveal>
      <Reveal>
        <p className={styles.line}>La música nace del territorio.</p>
      </Reveal>
      <Reveal>
        <p className={styles.line}>Las frecuencias nacen del sonido de la finca.</p>
      </Reveal>
      <Reveal>
        <p className={styles.lineDim}>
          El café <del>no acompaña</del> a la música.
        </p>
      </Reveal>
      <Reveal>
        <p className={styles.lineFinal}>
          La música <em>nace</em> del café.
        </p>
      </Reveal>
      <Reveal>
        <p className={styles.signature}>— Origen Tostado · Eje Cafetero, Colombia</p>
      </Reveal>
    </section>
  );
}
