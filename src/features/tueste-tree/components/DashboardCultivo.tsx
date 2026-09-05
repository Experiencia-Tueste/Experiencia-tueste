import Link from 'next/link';
import { SOLES_CULTIVO } from '../data/cultivo';
import {
  CULTIVO_EYEBROW,
  CULTIVO_TITLE,
  CULTIVO_LEAD,
  LEGEND_AVAILABLE,
  LEGEND_ADOPTED,
  LEGEND_YOURS,
  LEGEND_YOURS_EMPTY,
} from '../data/content';
import { CULTIVO_TERRAZA } from '../data/dashboard';
import TuesteTreeEyebrow from './TuesteTreeEyebrow';
import styles from '../tueste-tree.module.css';

/**
 * Sección «02 · EL CULTIVO» del dashboard.
 *
 * Composición editorial propia (inspirada en el mockup de José):
 * retícula de terrazas en CSS con 30 soles deterministas. Cada sol
 * disponible es un <Link> accesible al flujo de adopción (sin reservar
 * ni guardar nada); los adoptados son elementos no interactivos con
 * nombre accesible. Sin mapas, coordenadas ni imágenes externas.
 */
export default function DashboardCultivo() {
  return (
    <section
      id="cultivo-dash"
      className={styles.cultivoSection}
      aria-labelledby="cultivo-dash-titulo"
    >
      <TuesteTreeEyebrow>{CULTIVO_EYEBROW}</TuesteTreeEyebrow>
      <h2 id="cultivo-dash-titulo" className={styles.sectionTitle}>
        {CULTIVO_TITLE}
      </h2>
      <p className={styles.dropLead}>{CULTIVO_LEAD}</p>
      <p className={styles.terraza}>{CULTIVO_TERRAZA}</p>

      <ul className={styles.legend} aria-label="Leyenda del cultivo">
        <li className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotAvailable}`} aria-hidden="true" />
          {LEGEND_AVAILABLE}
        </li>
        <li className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotAdopted}`} aria-hidden="true" />
          {LEGEND_ADOPTED}
        </li>
        <li className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotYours}`} aria-hidden="true" />
          {LEGEND_YOURS}
          <span className={styles.legendEmpty}>{LEGEND_YOURS_EMPTY}</span>
        </li>
      </ul>

      <ul className={styles.cultivoGrid} aria-label="Soles del Lote 000 Founders">
        {SOLES_CULTIVO.map((sol) => (
          <li key={sol.id} className={styles.sunItem}>
            {sol.estado === 'disponible' ? (
              <Link
                href="/tueste-tree/adoptar"
                className={styles.sun}
                aria-label={`Elegir árbol ${sol.numero} del Lote 000`}
              >
                <span className={styles.sunNum} aria-hidden="true">
                  {sol.numero}
                </span>
              </Link>
            ) : (
              <span
                className={`${styles.sun} ${styles.sunAdopted}`}
                aria-label={`Árbol ${sol.numero} del Lote 000 · adoptado`}
              >
                <span className={styles.sunNum} aria-hidden="true">
                  {sol.numero}
                </span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
