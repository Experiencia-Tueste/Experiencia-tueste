import { FUNDADORES } from '../data/dashboard';
import styles from '../tueste-tree.module.css';

/**
 * Módulo de progreso del proyecto: barra principal con segmentos,
 * leyenda (adoptados, disponibles, próximos a liberar) y etiquetas
 * editoriales. Datos estáticos y demostrativos.
 */
export default function DashboardProgress() {
  const pct = Number(((FUNDADORES.acompanan / FUNDADORES.total) * 100).toFixed(1));

  return (
    <section className={styles.progressModule} aria-labelledby="progreso-titulo">
      <div className={styles.progressTop}>
        <h2 id="progreso-titulo" className={styles.progressModuleTitle}>
          Avance de la adopción
        </h2>
        <span className={styles.progressTotal}>
          {FUNDADORES.acompanan} de {FUNDADORES.total.toLocaleString('es-CO')} árboles ·{' '}
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
        <span className={styles.projectReleased} aria-hidden="true" />
        <span className={styles.projectAdopted} style={{ width: `${Math.max(pct, 0.6)}%` }} />
      </div>
      <div className={styles.projectMarks} aria-hidden="true">
        <span style={{ left: '2.95%' }}>Lote 000</span>
        <span style={{ left: '12.75%' }}>Lote 001</span>
        <span style={{ right: 0 }}>10.200</span>
      </div>
      <ul className={styles.progressLegend}>
        <li className={styles.progressLegendItem}>
          <span className={`${styles.legendDot} ${styles.dot_adopted}`} aria-hidden="true" />
          Adoptados
        </li>
        <li className={styles.progressLegendItem}>
          <span className={`${styles.legendDot} ${styles.dot_available}`} aria-hidden="true" />
          Liberado en drops
        </li>
        <li className={styles.progressLegendItem}>
          <span className={`${styles.legendDot} ${styles.dot_soon}`} aria-hidden="true" />
          Por liberar
        </li>
      </ul>

      <p className={styles.progressNote}>
        Cifras de muestra: no reflejan el estado real de las adopciones.
      </p>
    </section>
  );
}
