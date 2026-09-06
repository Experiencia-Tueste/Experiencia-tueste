import { FUNDADORES } from '../data/dashboard';
import { DASHBOARD_TITLE, FOUNDING_WINDOW } from '../data/content';
import styles from '../tueste-tree.module.css';

/**
 * Cabecera compacta del dashboard (escala de aplicación, no marketing):
 * título «Panel de adopción», ventana fundacional
 * abierta y lectura del Drop con barra de progreso pequeña.
 */
export default function DashboardHeader() {
  const dropTotal = 300;
  const pct = Math.round((FUNDADORES.acompanan / dropTotal) * 100);
  return (
    <header className={styles.dashHeader}>
      <div className={styles.dashHeaderTop}>
        <div>
          <h1 className={styles.dashTitle}>{DASHBOARD_TITLE}</h1>
          <p className={styles.dashSub}>{FOUNDING_WINDOW}</p>
        </div>
        <div className={styles.dashDropReadout}>
          <span className={styles.dashDropLabel}>Drop 000 · Founders</span>
          <strong className={styles.dashDropCount}>
            {FUNDADORES.acompanan} / {dropTotal}
          </strong>
          <span className={styles.dashDropText}>{FUNDADORES.acompanan} árboles ya acompañados</span>
          <div
            className={styles.dashDropBar}
            role="progressbar"
            aria-label="Progreso del Drop 000"
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
