import { ECOSISTEMA_MOTORES } from '../data/dashboard';
import TuesteTreeEyebrow from './TuesteTreeEyebrow';
import styles from '../tueste-tree.module.css';

/**
 * Sección «04 · El ecosistema»: «Cuatro motores que se alimentan entre
 * sí» con sus módulos. Contenido editorial.
 */
export default function DashboardEcosistema() {
  return (
    <section className={styles.blockSection} aria-labelledby="ecosistema-dash-titulo">
      <TuesteTreeEyebrow>04 · EL ECOSISTEMA</TuesteTreeEyebrow>
      <h2 id="ecosistema-dash-titulo" className={styles.sectionTitle}>
        Cuatro motores que se alimentan entre sí.
      </h2>
      <div className={styles.motores}>
        {ECOSISTEMA_MOTORES.map((motor) => (
          <article key={motor.n} className={styles.motor}>
            <span className={styles.motorNum} aria-hidden="true">
              {motor.n}
            </span>
            <strong className={styles.motorName}>{motor.name}</strong>
            <p className={styles.moduleText}>{motor.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
