import { PROMESA_TIMELINE, VOCES } from '../data/dashboard';
import { PROMESA, ORIGIN_LINK } from '../data/content';
import TuesteTreeEyebrow from './TuesteTreeEyebrow';
import styles from '../tueste-tree.module.css';

/**
 * Sección «05 · La promesa»: promesa, línea de tiempo editorial, la
 * conexión con el origen y los círculos que crecen desde la finca.
 */
export default function DashboardPromesa() {
  return (
    <section className={styles.blockSection} aria-labelledby="promesa-dash-titulo">
      <TuesteTreeEyebrow>05 · LA PROMESA</TuesteTreeEyebrow>
      <h2 id="promesa-dash-titulo" className={styles.sectionTitle}>
        {PROMESA.titulo}
      </h2>
      <p className={styles.moduleText}>{PROMESA.texto}</p>

      <ol className={styles.timeline}>
        {PROMESA_TIMELINE.map((hito) => (
          <li key={hito.title} className={styles.timelineItem}>
            <span className={styles.timelineWhen}>{hito.when}</span>
            <strong className={styles.timelineTitle}>{hito.title}</strong>
            <p className={styles.moduleText}>{hito.text}</p>
          </li>
        ))}
      </ol>

      <h3 className={styles.blockSubTitle}>{ORIGIN_LINK}</h3>
      <ul className={styles.voces}>
        {VOCES.map((voz) => (
          <li key={voz.n} className={styles.voz}>
            <span className={styles.motorNum} aria-hidden="true">
              {voz.n}
            </span>
            <strong className={styles.vozName}>{voz.name}</strong>
            <p className={styles.moduleText}>{voz.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
