import { MODELO_KPIS } from '../data/dashboard';
import { INSIGNIAS } from '../data/insignias';
import { INSIGNIAS_TITLE, MODELO_AVISO, MODELO_TITLE } from '../data/content';
import TuesteTreeEyebrow from './TuesteTreeEyebrow';
import styles from '../tueste-tree.module.css';

/**
 * Sección «03 · La adopción»: qué incluye, las cuatro insignias y el
 * aviso de que no es una inversión. Sin checkout.
 */
export default function DashboardModelo() {
  return (
    <section className={styles.blockSection} aria-labelledby="modelo-dash-titulo">
      <TuesteTreeEyebrow>03 · LA ADOPCIÓN</TuesteTreeEyebrow>
      <h2 id="modelo-dash-titulo" className={styles.sectionTitle}>
        {MODELO_TITLE}
      </h2>
      <p className={styles.moduleText}>
        Adoptas un árbol real, lo sigues hasta su primera cosecha y recibes tu café. La compra se
        hace en la tienda Tueste Co.
      </p>

      <div className={styles.kpis}>
        {MODELO_KPIS.map((kpi) => (
          <div key={kpi.label} className={styles.kpi}>
            <strong className={styles.kpiValue}>{kpi.valor}</strong>
            <span className={styles.kpiLabel}>{kpi.label}</span>
          </div>
        ))}
      </div>

      <h3 className={styles.blockSubTitle}>{INSIGNIAS_TITLE}</h3>
      <ul className={styles.ladder}>
        {INSIGNIAS.map((insignia) => (
          <li key={insignia.id} className={styles.ladderRow}>
            <span className={styles.levelNum} aria-hidden="true">
              {insignia.orden}
            </span>
            <strong className={styles.ladderName}>{insignia.nombre}</strong>
            <span className={styles.ladderMeta}>{insignia.arboles}</span>
          </li>
        ))}
      </ul>

      <p className={styles.legalAmplio}>{MODELO_AVISO}</p>
    </section>
  );
}
