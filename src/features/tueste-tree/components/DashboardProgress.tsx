import { FUNDADORES } from '../data/dashboard';
import styles from '../tueste-tree.module.css';

const numero = (valor: number) => valor.toLocaleString('es-CO');

/**
 * Módulo de progreso de la adopción: barra con los árboles adoptados
 * sobre el total del lote y la marca de la primera tanda. Las cifras son
 * las que publica la tienda (ver `FUNDADORES`).
 */
export default function DashboardProgress() {
  const pct = Number(((FUNDADORES.adoptados / FUNDADORES.total) * 100).toFixed(1));
  const pctTanda = Number(((FUNDADORES.tanda / FUNDADORES.total) * 100).toFixed(1));

  return (
    <section className={styles.progressModule} aria-labelledby="progreso-titulo">
      <div className={styles.progressTop}>
        <h2 id="progreso-titulo" className={styles.progressModuleTitle}>
          Avance de la adopción
        </h2>
        <span className={styles.progressTotal}>
          {numero(FUNDADORES.adoptados)} de {numero(FUNDADORES.total)} árboles ·{' '}
          {pct.toLocaleString('es-CO')}%
        </span>
      </div>

      <div
        className={styles.projectBar}
        role="progressbar"
        aria-label="Avance de la adopción"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span
          className={styles.projectReleased}
          style={{ width: `${pctTanda}%` }}
          aria-hidden="true"
        />
        <span className={styles.projectAdopted} style={{ width: `${Math.max(pct, 0.6)}%` }} />
      </div>
      <div className={styles.projectMarks} aria-hidden="true">
        <span style={{ left: `${pctTanda}%` }}>Primera tanda · {numero(FUNDADORES.tanda)}</span>
        <span style={{ right: 0 }}>{numero(FUNDADORES.total)}</span>
      </div>
      <ul className={styles.progressLegend}>
        <li className={styles.progressLegendItem}>
          <span className={`${styles.legendDot} ${styles.dot_adopted}`} aria-hidden="true" />
          Adoptados
        </li>
        <li className={styles.progressLegendItem}>
          <span className={`${styles.legendDot} ${styles.dot_available}`} aria-hidden="true" />
          Primera tanda
        </li>
        <li className={styles.progressLegendItem}>
          <span className={`${styles.legendDot} ${styles.dot_soon}`} aria-hidden="true" />
          Por liberar
        </li>
      </ul>

      <p className={styles.progressNote}>{FUNDADORES.fuente}</p>
    </section>
  );
}
