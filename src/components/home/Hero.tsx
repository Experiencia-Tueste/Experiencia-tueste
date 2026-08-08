import Sun from '../brand/Sun';
import Reveal from './Reveal';
import styles from './Hero.module.css';

/**
 * Hero de viewport completo. Replica la jerarquía editorial del mockup:
 * badge, kicker, titular en dos líneas, tagline, dos CTAs, stats y sello.
 * El sol central gira lento; las animaciones respetan prefers-reduced-motion
 * vía los tokens globales y refuerzos locales.
 */
export default function Hero() {
  return (
    <header id="top" className={styles.hero}>
      <div className={styles.ghost} aria-hidden="true">
        Frecuencia
      </div>

      <div className={styles.badge}>
        <b>Nuevo</b>
        <span>Ritual de Adopción 001 · 30 cupos · Finca Tres Esquinas</span>
      </div>

      <p className={styles.kicker}>
        <span className={styles.dot} aria-hidden="true" />
        Origen Tostado · Eje Cafetero
      </p>

      <Reveal>
        <h1 className={styles.title}>
          <span className={styles.line1}>Origen</span>
          <span className={styles.line2}>Tostado</span>
        </h1>
      </Reveal>

      <Reveal>
        <p className={styles.tagline}>El café también se escucha.</p>
      </Reveal>

      <Reveal>
        <div className={styles.ctas}>
          <a href="#frecuencias" className={styles.btnGlass}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
              <path d="M8 5v14l11-7z" />
            </svg>
            Entrar a la escucha
          </a>
          <a href="#lanzamientos" className={styles.btnBare}>
            Ver la música
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <polygon points="6 4 20 12 6 20 6 4" />
            </svg>
          </a>
        </div>
      </Reveal>

      <Reveal>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M2 12h3l2.5-6 4 12 3-8 2 4h5.5" />
            </svg>
            <div>
              <b>111→528 Hz</b>
              <i>Frecuencias grabadas en el origen cafetero</i>
            </div>
          </div>
          <div className={styles.stat}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 22v-7m0 0c-4 0-6.5-2.6-6.5-6.2C5.5 5 8 3 12 2c4 1 6.5 3 6.5 6.8 0 3.6-2.5 6.2-6.5 6.2Z" />
            </svg>
            <div>
              <b>10.000</b>
              <i>Árboles del primer lote · Finca Tres Esquinas</i>
            </div>
          </div>
        </div>
      </Reveal>

      <a className={styles.seal} href="#frecuencias" aria-label="Ir a la escucha">
        <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
          <defs>
            <path id="sealc" d="M60,14a46,46 0 1,1 -0.01,0" />
          </defs>
          <text>
            <textPath href="#sealc">Café · Música · Ritual · Tueste ·</textPath>
          </text>
          <circle cx="60" cy="60" r="28" />
        </svg>
        <b>1840</b>
      </a>

      <div className={styles.scrollhint} aria-hidden="true">
        SCROLL
        <i />
      </div>

      {/* Sol principal decorativo del hero */}
      <Sun size={320} className={styles.herosun} />
    </header>
  );
}
