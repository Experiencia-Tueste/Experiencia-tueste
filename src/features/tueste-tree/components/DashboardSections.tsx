import { CERTIFICADO, COMUNIDAD, FAQ_ITEMS, PROYECTO } from '../data/dashboard';
import TuesteTreeEyebrow from './TuesteTreeEyebrow';
import styles from '../tueste-tree.module.css';

/**
 * Secciones complementarias del dashboard: certificado/memoria,
 * territorio, santuario y acompañamiento, y preguntas frecuentes con
 * <details> accesibles. Contenido informativo.
 */
export default function DashboardSections() {
  return (
    <div className={styles.dashSections}>
      <section className={styles.blockSection} aria-labelledby="cert-dash-titulo">
        <TuesteTreeEyebrow>{CERTIFICADO.kicker}</TuesteTreeEyebrow>
        <h2 id="cert-dash-titulo" className={styles.sectionTitle}>
          {CERTIFICADO.titulo}
        </h2>
        <p className={styles.moduleText}>{CERTIFICADO.texto}</p>
      </section>

      <section className={styles.blockSection} aria-labelledby="terr-dash-titulo">
        <TuesteTreeEyebrow>{PROYECTO.territorio.kicker}</TuesteTreeEyebrow>
        <h2 id="terr-dash-titulo" className={styles.sectionTitle}>
          {PROYECTO.territorio.titulo}
        </h2>
        <p className={styles.moduleText}>{PROYECTO.territorio.texto}</p>
      </section>

      <section className={styles.blockSection} aria-labelledby="com-dash-titulo">
        <TuesteTreeEyebrow>06 · COMUNIDAD Y AYUDA</TuesteTreeEyebrow>
        <h2 id="com-dash-titulo" className={styles.sectionTitle}>
          Comunidad y ayuda
        </h2>
        <div className={styles.modules}>
          <article className={styles.module}>
            <TuesteTreeEyebrow>{COMUNIDAD.santuario.kicker}</TuesteTreeEyebrow>
            <h3 className={styles.moduleTitle}>{COMUNIDAD.santuario.titulo}</h3>
            <p className={styles.moduleText}>{COMUNIDAD.santuario.texto}</p>
          </article>
          <article className={styles.module}>
            <TuesteTreeEyebrow>{COMUNIDAD.acompanamiento.kicker}</TuesteTreeEyebrow>
            <h3 className={styles.moduleTitle}>{COMUNIDAD.acompanamiento.titulo}</h3>
            <p className={styles.moduleText}>{COMUNIDAD.acompanamiento.texto}</p>
          </article>
          <article className={styles.module}>
            <TuesteTreeEyebrow>PREGUNTAS FRECUENTES</TuesteTreeEyebrow>
            <h3 className={styles.moduleTitle}>Inquietudes frecuentes</h3>
            <div id="inquietudes" className={styles.faq}>
              {FAQ_ITEMS.map((item) => (
                <details key={item.pregunta} className={styles.faqItem}>
                  <summary className={styles.faqQuestion}>{item.pregunta}</summary>
                  <p className={styles.faqAnswer}>{item.respuesta}</p>
                </details>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
