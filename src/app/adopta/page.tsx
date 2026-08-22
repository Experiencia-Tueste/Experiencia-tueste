import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import SkipLink from '@/components/SkipLink';
import ThemeToggle from '@/components/home/ThemeToggle';
import AdoptionBondGrid from '@/features/adoption/components/AdoptionBondGrid';
import AdoptionCycle from '@/features/adoption/components/AdoptionCycle';
import AdoptionMemoryGrid from '@/features/adoption/components/AdoptionMemoryGrid';
import { getPuntoMapa } from '@/features/origen-map/data/puntos';
import OrigenMapPreview from '@/features/origen-map/components/OrigenMapPreview';
import * as content from '@/features/adoption/data/adoption-content';
import styles from '@/features/adoption/adoption.module.css';

/**
 * Metadata propia de la experiencia «Adopta tu árbol».
 */
export const metadata: Metadata = {
  title: 'Adopta tu árbol | Tueste',
  description: 'Una experiencia editorial para acompañar el ciclo del café en Finca Tres Esquinas.',
};

/**
 * /adopta — experiencia editorial «Adopta tu árbol».
 *
 * Mockup de propuesta para José: sin adopciones reales, sin pagos, sin
 * registro, sin persistencia ni integraciones externas. Ensambla las
 * seis secciones con los textos y fotografías locales de
 * `adoption-content.ts`.
 *
 * Elementos globales de Tueste que se conservan:
 * - SkipLink: primer elemento focalizable, salta al `main#contenido`.
 * - ThemeToggle global (mismo componente de toda la app): día/noche
 *   sin duplicar lógica de persistencia, clases ni hidratación.
 *
 * El territorio reutiliza el mini-mapa interactivo existente
 * (OrigenMapPreview) con el punto provisional `finca-tres-esquinas`;
 * la composición de esta página no decide ni duplica el proveedor.
 */
export default function AdoptaPage() {
  const finca = getPuntoMapa('finca-tres-esquinas');

  return (
    <div className={styles.page}>
      <SkipLink />
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          Tueste
        </Link>
        <p className={styles.headerTag}>EXPERIENCIA EDITORIAL</p>
        <ThemeToggle />
      </header>
      <main id="contenido" tabIndex={-1}>
        <section id="inicio" className={styles.hero} aria-labelledby="adopta-titulo">
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <p className={styles.kicker}>{content.HERO_KICKER}</p>
              <h1 id="adopta-titulo" className={styles.title}>
                {content.HERO_TITLE}
              </h1>
              <p className={styles.paragraph}>{content.HERO_PARAGRAPH}</p>
              <a href={content.HERO_CTA_HREF} className={styles.cta}>
                {content.HERO_CTA}
                <span className={styles.ctaArrow} aria-hidden="true">
                  ↓
                </span>
              </a>
            </div>
            <div className={styles.heroVisual}>
              <Image
                src={content.HERO_IMAGE_SRC}
                alt={content.HERO_IMAGE_ALT}
                fill
                priority
                sizes="(max-width: 880px) 100vw, 55vw"
                className={styles.heroImage}
              />
              <span className={styles.heroOverlay} aria-hidden="true" />
            </div>
          </div>
        </section>

        <section id="vinculo" className={styles.section} aria-labelledby="vinculo-titulo">
          <div className={styles.introHead}>
            <p className={styles.sectionKicker}>{content.INTRO_KICKER}</p>
            <h2 id="vinculo-titulo" className={styles.sectionTitle}>
              {content.INTRO_TITLE}
            </h2>
            <p className={styles.sectionText}>{content.INTRO_PARAGRAPH}</p>
          </div>
          <AdoptionBondGrid />
        </section>

        <section id="ciclo" className={styles.section} aria-labelledby="ciclo-titulo">
          <p className={styles.sectionKicker}>{content.CYCLE_KICKER}</p>
          <h2 id="ciclo-titulo" className={styles.sectionTitle}>
            {content.CYCLE_TITLE}
          </h2>
          <AdoptionCycle />
        </section>

        <section id="territorio" className={styles.section} aria-labelledby="territorio-titulo">
          <p className={styles.sectionKicker}>{content.TERRITORY_KICKER}</p>
          <h2 id="territorio-titulo" className={styles.sectionTitle}>
            {content.TERRITORY_TITLE}
          </h2>
          <p className={styles.sectionText}>{content.TERRITORY_TEXT}</p>
          {finca && (
            <div className={styles.territoryMap}>
              <OrigenMapPreview
                punto={finca}
                etiqueta={content.TERRITORY_LABEL}
                ocultarDescripcionFallback
              />
            </div>
          )}
          <p className={styles.territoryCaption}>{content.TERRITORY_LABEL}</p>
        </section>

        <section
          id="acompanamiento"
          className={styles.section}
          aria-labelledby="acompanamiento-titulo"
        >
          <p className={styles.sectionKicker}>{content.COMPANION_KICKER}</p>
          <h2 id="acompanamiento-titulo" className={styles.sectionTitle}>
            {content.COMPANION_TITLE}
          </h2>
          <p className={styles.companionTag}>{content.COMPANION_TAG}</p>
          <AdoptionMemoryGrid />
          <p className={styles.companionNote}>{content.COMPANION_NOTE}</p>
        </section>

        <section
          id="cierre"
          className={`${styles.section} ${styles.closing}`}
          aria-labelledby="cierre-titulo"
        >
          <h2 id="cierre-titulo" className={styles.closingPhrase}>
            {content.CLOSING_PHRASE}
          </h2>
          <a href={content.CLOSING_CTA_HREF} className={styles.cta}>
            {content.CLOSING_CTA}
            <span className={styles.ctaArrow} aria-hidden="true">
              ↑
            </span>
          </a>
          <p className={styles.closingNote}>{content.CLOSING_NOTE}</p>
        </section>
      </main>
    </div>
  );
}
