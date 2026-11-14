import { ADOPCION, INSIGNIAS } from '../data/insignias';
import { MODELO_AVISO, MODELO_TITLE } from '../data/content';
import TuesteTreeEyebrow from './TuesteTreeEyebrow';
import styles from '../tueste-tree.module.css';

/**
 * Qué incluye la adopción (sección independiente tras el ritual): café
 * por árbol, certificado, las cuatro insignias y el aviso de que no es
 * una inversión. Sin checkout ni botones de pago: se compra en la tienda.
 */
export default function ModeloFundacional() {
  return (
    <section className={styles.modelo} aria-labelledby="modelo-titulo">
      <TuesteTreeEyebrow>LA ADOPCIÓN</TuesteTreeEyebrow>
      <h2 id="modelo-titulo" className={styles.sectionTitle}>
        {MODELO_TITLE}
      </h2>

      <div className={styles.modeloStats}>
        <div className={styles.modeloStat}>
          <span className={styles.statusLabel}>Café por árbol</span>
          <strong className={styles.modeloStatValue}>{ADOPCION.cafeTexto}</strong>
        </div>
        <div className={styles.modeloStat}>
          <span className={styles.statusLabel}>Certificado numerado</span>
          <strong className={styles.modeloStatValue}>{ADOPCION.certificadoTexto}</strong>
        </div>
        <div className={styles.modeloStat}>
          <span className={styles.statusLabel}>Insignias</span>
          <strong className={styles.modeloStatValue}>{INSIGNIAS.length}</strong>
        </div>
      </div>

      <ul className={styles.modeloList}>
        {INSIGNIAS.map((insignia) => (
          <li key={insignia.id} className={styles.modeloRow}>
            <span className={styles.levelNum} aria-hidden="true">
              {insignia.orden}
            </span>
            <strong className={styles.modeloRowName}>{insignia.nombre}</strong>
            <span className={styles.modeloRowMeta}>{insignia.arboles}</span>
          </li>
        ))}
      </ul>

      <p className={styles.legalAmplio}>{MODELO_AVISO}</p>
    </section>
  );
}
