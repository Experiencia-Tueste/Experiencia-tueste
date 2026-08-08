import type { Track } from '@/features/audio';
import styles from './Deck.module.css';

/**
 * Barras del visualizador · 24 coordenadas precalculadas (una cada 15°,
 * radio interior 60, radio exterior variable según patrón) y fijadas como
 * literal `as const`. El render es determinista: no hay trigonometría en
 * el módulo ni en el render, por lo que el SVG del servidor y del cliente
 * son idénticos y no se registran errores de hydration.
 */
const BARRAS = [
  [260, 200, 286, 200],
  [258, 215.5, 289.8, 224.1],
  [252, 230, 286.6, 250],
  [242.4, 242.4, 275.7, 275.7],
  [230, 252, 257, 298.7],
  [215.5, 258, 222.3, 283.1],
  [200, 260, 200, 293],
  [184.5, 258, 174.1, 296.6],
  [170, 252, 146.5, 292.7],
  [157.6, 242.4, 119.4, 280.6],
  [148, 230, 125.5, 243],
  [142, 215.5, 110.2, 224.1],
  [140, 200, 100, 200],
  [142, 184.5, 96.6, 172.3],
  [148, 170, 101.3, 143],
  [157.6, 157.6, 139.2, 139.2],
  [170, 148, 153.5, 119.5],
  [184.5, 142, 174.1, 103.4],
  [200, 140, 200, 93],
  [215.5, 142, 229.5, 89.9],
  [230, 148, 243, 125.5],
  [242.4, 157.6, 265.8, 134.2],
  [252, 170, 286.6, 150],
  [258, 184.5, 303.4, 172.3],
] as const;

/**
 * Deck oscuro del reproductor: visualizador de frecuencia hecho con SVG
 * (barras de ecualizador), estado EN VIVO, frecuencia y control principal.
 * No reproduce audio real todavía: el botón dispara el mensaje aria-live
 * del padre vía `onPlay`.
 */
export default function Deck({ track, onPlay }: { track: Track | undefined; onPlay: () => void }) {
  const hzLabel = track ? `${track.hz} Hz · ${track.title}` : '— Hz · esperando señal';

  return (
    <div className={styles.deck}>
      <svg
        className={styles.viz}
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="deck-glow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--teal-bright)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--amber)" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* Círculos concéntricos del deck */}
        <circle
          cx="200"
          cy="200"
          r="150"
          fill="none"
          stroke="rgba(255,232,191,0.08)"
          strokeWidth="1"
        />
        <circle
          cx="200"
          cy="200"
          r="118"
          fill="none"
          stroke="rgba(255,232,191,0.06)"
          strokeWidth="1"
        />
        <circle
          cx="200"
          cy="200"
          r="86"
          fill="none"
          stroke="rgba(255,232,191,0.05)"
          strokeWidth="1"
        />
        {/* Barras de ecualizador alrededor del centro */}
        {BARRAS.map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="url(#deck-glow)"
            strokeWidth="3"
            strokeLinecap="round"
            className={styles.bar}
            style={{ animationDelay: `${i * 0.09}s` }}
          />
        ))}
      </svg>

      <button
        type="button"
        className={styles.play}
        onClick={onPlay}
        aria-label="Reproducir pista seleccionada"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>

      <div className={styles.meta}>
        <span className={styles.hz}>{hzLabel}</span>
        <span className={styles.live}>EN VIVO</span>
      </div>
    </div>
  );
}
