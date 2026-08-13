import Image from 'next/image';
import Link from 'next/link';
import ExperienceArtworkMotion from './ExperienceArtworkMotion';
import styles from './ExperienceCard.module.css';

/**
 * Tarjeta Experiencia Origen Tostado: navega a /experiencia.
 * La tarjeta completa es un enlace real (navegable por teclado).
 *
 * Ilustración: arte local `portal-experiencia-artwork-v1.webp`
 * (1448 × 1086) como imagen decorativa (alt="" + aria-hidden), con
 * sizes para tarjeta apilada en móvil y dos columnas en escritorio.
 * La animación es discreta y no deforma el arte: un halo radial muy
 * suave sobre el centro del vinilo (CSS puro) y, en hover/focus, una
 * leve mejora de brillo, glow y escala máxima 1.025. Con
 * prefers-reduced-motion el halo se detiene y no hay transiciones.
 * Sin Canvas, sin AudioContext, sin <audio> y sin JS de animación.
 */
export default function ExperienceCard() {
  return (
    <Link href="/experiencia" className={styles.card}>
      <span className={styles.medallion} aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        >
          <path d="M2 12 h3 M19 12 h3 M2 8 h2 M20 8 h2 M2 16 h2 M20 16 h2" />
          <path d="M5 9 q2 4 4 3 t4 -3 t4 3 t4 -3" />
          <path d="M5 15 q2 -4 4 -3 t4 3 t4 -3 t4 3" />
        </svg>
      </span>
      <div className={styles.visual} aria-hidden="true">
        <Image
          src="/images/portal/portal-experiencia-artwork-v1.webp"
          alt=""
          width={1448}
          height={1086}
          className={styles.art}
          sizes="(max-width: 780px) 100vw, 574px"
        />
        <span className={styles.halo} />
        <ExperienceArtworkMotion />
      </div>
      <h2 className={styles.title}>Experiencia Origen Tostado</h2>
      <p className={styles.desc}>Música, frecuencias y territorio para escuchar el café.</p>
      <span className={styles.cta}>
        Entrar a la experiencia
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      </span>
    </Link>
  );
}
