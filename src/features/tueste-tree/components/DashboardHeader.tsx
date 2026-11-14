import { FUNDADORES } from '../data/dashboard';
import { DASHBOARD_TITLE, FOUNDING_WINDOW } from '../data/content';
import styles from '../tueste-tree.module.css';

const numero = (valor: number) => valor.toLocaleString('es-CO');

/**
 * Cabecera compacta del dashboard (escala de aplicación, no marketing):
 * título «Panel de adopción», adopción abierta y lectura de la primera
 * tanda con barra de progreso pequeña.
 */
export default function DashboardHeader() {
  const quedan = FUNDADORES.tanda - FUNDADORES.adoptados;
  const pct = Math.round((FUNDADORES.adoptados / FUNDADORES.tanda) * 100);
  return (
    <header className={styles.dashHeader}>
      <div className={styles.dashHeaderTop}>
        <div>
          <h1 className={styles.dashTitle}>{DASHBOARD_TITLE}</h1>
          <p className={styles.dashSub}>{FOUNDING_WINDOW}</p>
        </div>
        <div className={styles.dashDropReadout}>
          <span className={styles.dashDropLabel}>Primera tanda</span>
          <strong className={styles.dashDropCount}>
            {numero(FUNDADORES.adoptados)} / {numero(FUNDADORES.tanda)}
          </strong>
          <span className={styles.dashDropText}>
            {numero(FUNDADORES.adoptados)} árboles adoptados · quedan {numero(quedan)}
          </span>
          <div
            className={styles.dashDropBar}
            role="progressbar"
            aria-label="Progreso de la primera tanda"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span className={styles.dashDropFill} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </header>
  );
}
