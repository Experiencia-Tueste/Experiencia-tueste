import styles from './Atmosphere.module.css';

/**
 * Atmosphere · mesh atmosférico de fondo.
 * Cuatro orbes (teal, coral, lavanda, ámbar) con blur y deriva lenta,
 * replicando la atmósfera del mockup. Puramente decorativo.
 */
export default function Atmosphere() {
  return (
    <div className={styles.mesh} aria-hidden="true">
      <span className={styles.m1} />
      <span className={styles.m2} />
      <span className={styles.m3} />
      <span className={styles.m4} />
    </div>
  );
}
