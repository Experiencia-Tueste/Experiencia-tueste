import { LOTE_000_FOUNDERS, NIVELES_FUNDACIONALES } from '../data/niveles';
import { MODELO_AVISO, MODELO_CAPITAL, MODELO_TITLE } from '../data/content';
import TuesteTreeEyebrow from './TuesteTreeEyebrow';
import styles from '../tueste-tree.module.css';

/**
 * Modelo fundacional (sección independiente tras el ritual): «Los
 * primeros 10.200 árboles», capital objetivo y porcentaje como cifras
 * estrictamente informativas, lista editorial de niveles y aviso legal
 * preciso. Sin checkout ni botones de pago.
 */
export default function ModeloFundacional() {
  return (
    <section className={styles.modelo} aria-labelledby="modelo-titulo">
      <TuesteTreeEyebrow>EL MODELO FUNDACIONAL</TuesteTreeEyebrow>
      <h2 id="modelo-titulo" className={styles.sectionTitle}>
        {MODELO_TITLE}
      </h2>

      <div className={styles.modeloStats}>
        <div className={styles.modeloStat}>
          <span className={styles.statusLabel}>Árboles fundacionales</span>
          <strong className={styles.modeloStatValue}>
            {LOTE_000_FOUNDERS.arboles.toLocaleString('es-CO')}
          </strong>
        </div>
        <div className={styles.modeloStat}>
          <span className={styles.statusLabel}>Capital objetivo</span>
          <strong className={styles.modeloStatValue}>{MODELO_CAPITAL}</strong>
        </div>
        <div className={styles.modeloStat}>
          <span className={styles.statusLabel}>Participación del proyecto</span>
          <strong className={styles.modeloStatValue}>
            {LOTE_000_FOUNDERS.participacionProyecto}
          </strong>
        </div>
      </div>

      <ul className={styles.modeloList}>
        {NIVELES_FUNDACIONALES.map((nivel) => (
          <li key={nivel.id} className={styles.modeloRow}>
            <span className={styles.levelNum} aria-hidden="true">
              {nivel.nivel}
            </span>
            <strong className={styles.modeloRowName}>{nivel.nombre}</strong>
            <span className={styles.modeloRowMeta}>{nivel.arboles}</span>
            <span className={styles.modeloRowMeta}>{nivel.equity}</span>
            <span className={styles.modeloRowUsd}>{nivel.usd}</span>
          </li>
        ))}
      </ul>

      <p className={styles.legalAmplio}>{MODELO_AVISO}</p>
    </section>
  );
}
