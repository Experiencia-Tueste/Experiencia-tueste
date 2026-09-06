import { PROMESA, COMUNIDAD_CIERRE, TERRITORIO_CIERRE, SIGUE_TEXT } from '../data/content';
import TuesteTreeEyebrow from './TuesteTreeEyebrow';
import styles from '../tueste-tree.module.css';

/**
 * Cierre de la adopción equivalente al mockup: promesa de seguimiento,
 * comunidad, territorio y actualizaciones futuras como contenido
 * editorial. El footer legal compacto cierra la página.
 */
export default function PromesaEcosistema() {
  return (
    <section className={styles.cierre} aria-labelledby="cierre-titulo">
      <div className={styles.cierreGrid}>
        <article className={styles.cierreCard}>
          <TuesteTreeEyebrow>LA PROMESA</TuesteTreeEyebrow>
          <h3 className={styles.moduleTitle}>{PROMESA.titulo}</h3>
          <p className={styles.moduleText}>{PROMESA.texto}</p>
        </article>
        <article className={styles.cierreCard}>
          <TuesteTreeEyebrow>COMUNIDAD</TuesteTreeEyebrow>
          <h3 className={styles.moduleTitle}>{COMUNIDAD_CIERRE.titulo}</h3>
          <p className={styles.moduleText}>{COMUNIDAD_CIERRE.texto}</p>
        </article>
        <article className={styles.cierreCard}>
          <TuesteTreeEyebrow>TERRITORIO</TuesteTreeEyebrow>
          <h3 className={styles.moduleTitle}>{TERRITORIO_CIERRE.titulo}</h3>
          <p className={styles.moduleText}>{TERRITORIO_CIERRE.texto}</p>
        </article>
        <article className={styles.cierreCard}>
          <TuesteTreeEyebrow>ACTUALIZACIONES</TuesteTreeEyebrow>
          <h3 className={styles.moduleTitle}>{SIGUE_TEXT.titulo}</h3>
          <p className={styles.moduleText}>{SIGUE_TEXT.texto}</p>
        </article>
      </div>
    </section>
  );
}
