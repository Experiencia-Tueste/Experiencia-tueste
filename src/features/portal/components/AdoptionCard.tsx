import Link from 'next/link';
import styles from './AdoptionCard.module.css';

/**
 * Tarjeta «Adopta tu árbol» del portal: tercer camino de tueste.co.
 * La tarjeta completa es un enlace interno a /adopta (navegable por
 * teclado, con foco visible).
 *
 * Visual: composición CSS local (colinas verdes, sol ámbar y árbol
 * abstracto), sin imágenes externas ni raster. El medallón sigue el
 * patrón SVG del portal.
 */
export default function AdoptionCard() {
  return (
    <Link href="/adopta" className={styles.card}>
      <span className={styles.medallion} aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        >
          <path d="M12 19 V11" />
          <path d="M12 13 Q8 12 7 8.5" />
          <path d="M12 13 Q16 12 17 8.5" />
          <path d="M12 12 Q10 9 9.5 6.5" />
          <path d="M12 12 Q14 9 14.5 6.5" />
        </svg>
      </span>
      <div className={styles.visual} aria-hidden="true">
        <span className={styles.hillBack} />
        <span className={styles.hillFront} />
        <span className={styles.sun} />
        <span className={styles.treeTrunk} />
        <span className={styles.treeCrownOne} />
        <span className={styles.treeCrownTwo} />
        <span className={styles.plotRow} />
      </div>
      <p className={styles.kicker}>NUEVO CAMINO</p>
      <h2 className={styles.title}>Adopta tu árbol</h2>
      <p className={styles.desc}>Acompaña el ciclo del café desde la tierra hasta la taza.</p>
      <span className={styles.cta}>
        Conocer la adopción
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      </span>
    </Link>
  );
}
