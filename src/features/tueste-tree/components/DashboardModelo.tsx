import { MODELO_KPIS } from '../data/dashboard';
import { NIVELES_FUNDACIONALES } from '../data/niveles';
import { MODELO_AVISO } from '../data/content';
import TuesteTreeEyebrow from './TuesteTreeEyebrow';
import styles from '../tueste-tree.module.css';

/**
 * Sección «03 · El modelo»: «Los primeros 10.200 árboles», KPIs
 * informativos, escalera de seis niveles y aviso legal. Sin checkout.
 */
export default function DashboardModelo() {
  return (
    <section className={styles.blockSection} aria-labelledby="modelo-dash-titulo">
      <TuesteTreeEyebrow>03 · EL MODELO</TuesteTreeEyebrow>
      <h2 id="modelo-dash-titulo" className={styles.sectionTitle}>
        Los primeros 10.200 árboles.
      </h2>
      <p className={styles.moduleText}>
        Una etapa única de consolidación, no una oferta permanente. Después, cada nuevo árbol será
        solo de adopción.
      </p>

      <div className={styles.kpis}>
        {MODELO_KPIS.map((kpi) => (
          <div key={kpi.label} className={styles.kpi}>
            <strong className={styles.kpiValue}>{kpi.valor}</strong>
            <span className={styles.kpiLabel}>{kpi.label}</span>
          </div>
        ))}
      </div>

      <h3 className={styles.blockSubTitle}>Seis niveles para cofundar.</h3>
      <ul className={styles.ladder}>
        {NIVELES_FUNDACIONALES.map((nivel) => (
          <li key={nivel.id} className={styles.ladderRow}>
            <span className={styles.levelNum} aria-hidden="true">
              {nivel.nivel}
            </span>
            <strong className={styles.ladderName}>{nivel.nombre}</strong>
            <span className={styles.ladderMeta}>{nivel.arboles}</span>
            <span className={styles.ladderMeta}>{nivel.equity}</span>
            <span className={styles.ladderUsd}>{nivel.usd}</span>
          </li>
        ))}
      </ul>

      <p className={styles.legalAmplio}>{MODELO_AVISO}</p>
    </section>
  );
}
