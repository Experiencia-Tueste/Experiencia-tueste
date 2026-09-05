import Image from 'next/image';
import {
  ADOPT_LEAD,
  ADOPT_NOT_CHECKOUT,
  ADOPT_TITLE,
  DROP_OPEN_EYEBROW,
  HERO_METRICS,
} from '../data/content';
import styles from '../tueste-tree.module.css';

/**
 * Hero de adopción (paridad con la referencia): composición premium de
 * dos columnas — copy con dos CTA («Elegir mi árbol» → #cultivo y
 * «Ver niveles» → #modelo), tres métricas editoriales y el vitral verde
 * local con halo y sombra. En móvil: una columna sin cortes.
 */
export default function AdoptionHero() {
  return (
    <section className={styles.adoptHero} aria-labelledby="tt-adopt-titulo">
      <div className={styles.adoptContent}>
        <p className={styles.adoptPill}>
          <span aria-hidden="true" />
          {DROP_OPEN_EYEBROW}
        </p>
        <h1 id="tt-adopt-titulo" className={styles.adoptTitle}>
          {ADOPT_TITLE}
        </h1>
        <p className={styles.adoptLead}>{ADOPT_LEAD}</p>
        <p className={styles.notCheckout}>{ADOPT_NOT_CHECKOUT}</p>

        <div className={styles.adoptCtas}>
          <a href="#cultivo" className={styles.ctaPrimary}>
            Elegir mi árbol
            <span aria-hidden="true">↓</span>
          </a>
          <a href="#modelo" className={styles.ctaGhost}>
            Ver niveles
          </a>
        </div>

        <dl className={styles.metrics}>
          {HERO_METRICS.map((metrica) => (
            <div key={metrica.label} className={styles.metric}>
              <dt>{metrica.label}</dt>
              <dd>{metrica.valor}</dd>
            </div>
          ))}
        </dl>
      </div>

      <figure className={styles.adoptVisual}>
        <span className={styles.adoptHalo} aria-hidden="true" />
        <Image
          src="/images/tueste-tree/vitral-verde.png"
          alt="Vitral verde Tueste: arte editorial del cultivo"
          width={682}
          height={908}
          sizes="(max-width: 880px) min(100vw - 36px, 440px), min(42vw, 440px)"
          priority
          className={styles.adoptVitral}
        />
      </figure>
    </section>
  );
}
