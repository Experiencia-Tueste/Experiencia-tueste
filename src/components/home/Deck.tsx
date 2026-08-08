'use client';

import { useEffect, useRef } from 'react';
import type { Track } from '@/features/audio';
import styles from './Deck.module.css';

/**
 * Artefacto visual del deck, portado 1:1 de la referencia funcional
 * Master Debugg (deckLoop): 64 barras radiales con gradiente
 * teal→amber→coral, tres anillos orgánicos animados, núcleo solar y
 * pulso de brillo al sonar. Toda la trigonometría está precalculada en
 * build-time (vectores unitarios UX/UY y tabla de fases RINGS): el
 * runtime solo hace sumas y multiplicaciones, y el dibujo es
 * determinista (el canvas no serializa contenido, así que no hay
 * errores de hydration).
 */

/** Vectores unitarios de las 64 barras (ángulo i/64·2π − π/2, como el Master). */
const UX = [
  0.0, 0.098017, 0.19509, 0.290285, 0.382683, 0.471397, 0.55557, 0.634393, 0.707107, 0.77301,
  0.83147, 0.881921, 0.92388, 0.95694, 0.980785, 0.995185, 1.0, 0.995185, 0.980785, 0.95694,
  0.92388, 0.881921, 0.83147, 0.77301, 0.707107, 0.634393, 0.55557, 0.471397, 0.382683, 0.290285,
  0.19509, 0.098017, 0.0, -0.098017, -0.19509, -0.290285, -0.382683, -0.471397, -0.55557, -0.634393,
  -0.707107, -0.77301, -0.83147, -0.881921, -0.92388, -0.95694, -0.980785, -0.995185, -1.0,
  -0.995185, -0.980785, -0.95694, -0.92388, -0.881921, -0.83147, -0.77301, -0.707107, -0.634393,
  -0.55557, -0.471397, -0.382683, -0.290285, -0.19509, -0.098017,
] as const;

const UY = [
  -1.0, -0.995185, -0.980785, -0.95694, -0.92388, -0.881921, -0.83147, -0.77301, -0.707107,
  -0.634393, -0.55557, -0.471397, -0.382683, -0.290285, -0.19509, -0.098017, 0.0, 0.098017, 0.19509,
  0.290285, 0.382683, 0.471397, 0.55557, 0.634393, 0.707107, 0.77301, 0.83147, 0.881921, 0.92388,
  0.95694, 0.980785, 0.995185, 1.0, 0.995185, 0.980785, 0.95694, 0.92388, 0.881921, 0.83147,
  0.77301, 0.707107, 0.634393, 0.55557, 0.471397, 0.382683, 0.290285, 0.19509, 0.098017, 0.0,
  -0.098017, -0.19509, -0.290285, -0.382683, -0.471397, -0.55557, -0.634393, -0.707107, -0.77301,
  -0.83147, -0.881921, -0.92388, -0.95694, -0.980785, -0.995185,
] as const;

/**
 * Fases de los 3 anillos orgánicos: 64 frames a 60 fps de la órbita del
 * Master (sin(t·0.001+k)·4px sobre la base R·(0.55+0.18k), R=120).
 * Precalculadas: el runtime solo indexa por frame.
 */
const RINGS = [
  [131.36, 112.84, 90.97],
  [131.3, 112.81, 91.0],
  [131.23, 112.78, 91.04],
  [131.17, 112.75, 91.07],
  [131.1, 112.72, 91.1],
  [131.03, 112.69, 91.13],
  [130.97, 112.65, 91.16],
  [130.9, 112.62, 91.19],
  [130.83, 112.58, 91.22],
  [130.77, 112.55, 91.25],
  [130.7, 112.51, 91.28],
  [130.63, 112.47, 91.3],
  [130.57, 112.43, 91.33],
  [130.5, 112.39, 91.35],
  [130.43, 112.35, 91.37],
  [130.37, 112.31, 91.4],
  [130.3, 112.27, 91.42],
  [130.23, 112.23, 91.44],
  [130.17, 112.18, 91.45],
  [130.1, 112.14, 91.47],
  [130.04, 112.09, 91.49],
  [129.97, 112.05, 91.5],
  [129.91, 112.0, 91.52],
  [129.84, 111.95, 91.53],
  [129.78, 111.9, 91.54],
  [129.71, 111.85, 91.55],
  [129.65, 111.8, 91.56],
  [129.59, 111.75, 91.57],
  [129.52, 111.7, 91.58],
  [129.46, 111.65, 91.58],
  [129.4, 111.59, 91.59],
  [129.33, 111.54, 91.59],
  [129.27, 111.49, 91.6],
  [129.21, 111.43, 91.6],
  [129.15, 111.38, 91.6],
  [129.09, 111.32, 91.6],
  [129.03, 111.26, 91.6],
  [128.97, 111.2, 91.6],
  [128.91, 111.15, 91.59],
  [128.85, 111.09, 91.59],
  [128.79, 111.03, 91.58],
  [128.74, 110.97, 91.57],
  [128.68, 110.91, 91.57],
  [128.62, 110.85, 91.56],
  [128.57, 110.79, 91.55],
  [128.51, 110.73, 91.54],
  [128.46, 110.66, 91.52],
  [128.41, 110.6, 91.51],
  [128.35, 110.54, 91.5],
  [128.3, 110.48, 91.48],
  [128.25, 110.41, 91.46],
  [128.2, 110.35, 91.45],
  [128.15, 110.29, 91.43],
  [128.1, 110.22, 91.41],
  [128.05, 110.16, 91.39],
  [128.0, 110.09, 91.36],
  [127.95, 110.03, 91.34],
  [127.91, 109.96, 91.32],
  [127.86, 109.9, 91.29],
  [127.82, 109.83, 91.26],
  [127.77, 109.76, 91.24],
  [127.73, 109.7, 91.21],
  [127.69, 109.63, 91.18],
  [127.65, 109.57, 91.15],
] as const;

/**
 * Paleta del Master (COL en origen-tostado.js) en valores reales: el
 * canvas no resuelve var() de CSS. Los alfas hex del Master se
 * traducen a rgba: "22"≈13 %, "cc"≈80 %, "55"≈33 %, "10"≈6 %.
 */
const TEAL = '#19c9b8';
const AMBER = '#fba922';
const CORAL = '#ff6f86';
const TEAL_22 = 'rgba(25, 201, 184, 0.13)';
const PURPLE_22 = 'rgba(138, 139, 208, 0.13)';
const CORAL_22 = 'rgba(255, 111, 134, 0.13)';
const AMBER_CC = 'rgba(251, 169, 34, 0.8)';
const AMBER_55 = 'rgba(251, 169, 34, 0.33)';
const AMBER_10 = 'rgba(251, 169, 34, 0.06)';

/** Geometría del Master en el espacio lógico 400×400: R = 0.3·400 = 120. */
const R = 120;
const INTERIOR = R * 0.5; // 60 — origen de las barras
const BASE_LEN = R * 0.35; // 42 — longitud en reposo
const MAX_LEN = R * 1.05; // 126 — amplitud a volumen máximo
const CORE_R = R * 0.5; // 60 — radio del núcleo solar
const RING_COLORS = [PURPLE_22, TEAL_22, CORAL_22] as const; // k=3, 2, 1

/**
 * Señal idle del master, precalculada en build-time: el master genera
 * vals[i] = (sin(t·0.002 + i·0.4)·0.5 + 0.5)·0.18 + 0.04 por frame.
 * IDLE_WAVE muestrea esa onda en 256 puntos por ciclo (resolución
 * imperceptible) y el runtime solo avanza un índice modular con
 * multiplicaciones y sumas — sin Math.sin/cos/random ni fechas. La
 * velocidad coincide con el master: 0.002 rad/ms → ciclo de ~3.14 s.
 */
export const IDLE_WAVE = [
  0.13, 0.132, 0.134, 0.137, 0.139, 0.141, 0.143, 0.145, 0.148, 0.15, 0.152, 0.154, 0.156, 0.158,
  0.16, 0.162, 0.164, 0.166, 0.168, 0.17, 0.172, 0.174, 0.176, 0.178, 0.18, 0.182, 0.184, 0.185,
  0.187, 0.189, 0.19, 0.192, 0.194, 0.195, 0.197, 0.198, 0.2, 0.201, 0.202, 0.204, 0.205, 0.206,
  0.207, 0.208, 0.209, 0.21, 0.211, 0.212, 0.213, 0.214, 0.215, 0.215, 0.216, 0.217, 0.217, 0.218,
  0.218, 0.219, 0.219, 0.219, 0.22, 0.22, 0.22, 0.22, 0.22, 0.22, 0.22, 0.22, 0.22, 0.219, 0.219,
  0.219, 0.218, 0.218, 0.217, 0.217, 0.216, 0.215, 0.215, 0.214, 0.213, 0.212, 0.211, 0.21, 0.209,
  0.208, 0.207, 0.206, 0.205, 0.204, 0.202, 0.201, 0.2, 0.198, 0.197, 0.195, 0.194, 0.192, 0.19,
  0.189, 0.187, 0.185, 0.184, 0.182, 0.18, 0.178, 0.176, 0.174, 0.172, 0.17, 0.168, 0.166, 0.164,
  0.162, 0.16, 0.158, 0.156, 0.154, 0.152, 0.15, 0.148, 0.145, 0.143, 0.141, 0.139, 0.137, 0.134,
  0.132, 0.13, 0.128, 0.126, 0.123, 0.121, 0.119, 0.117, 0.115, 0.112, 0.11, 0.108, 0.106, 0.104,
  0.102, 0.1, 0.098, 0.096, 0.094, 0.092, 0.09, 0.088, 0.086, 0.084, 0.082, 0.08, 0.078, 0.076,
  0.075, 0.073, 0.071, 0.07, 0.068, 0.066, 0.065, 0.063, 0.062, 0.06, 0.059, 0.058, 0.056, 0.055,
  0.054, 0.053, 0.052, 0.051, 0.05, 0.049, 0.048, 0.047, 0.046, 0.045, 0.045, 0.044, 0.043, 0.043,
  0.042, 0.042, 0.041, 0.041, 0.041, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.041,
  0.041, 0.041, 0.042, 0.042, 0.043, 0.043, 0.044, 0.045, 0.045, 0.046, 0.047, 0.048, 0.049, 0.05,
  0.051, 0.052, 0.053, 0.054, 0.055, 0.056, 0.058, 0.059, 0.06, 0.062, 0.063, 0.065, 0.066, 0.068,
  0.07, 0.071, 0.073, 0.075, 0.076, 0.078, 0.08, 0.082, 0.084, 0.086, 0.088, 0.09, 0.092, 0.094,
  0.096, 0.098, 0.1, 0.102, 0.104, 0.106, 0.108, 0.11, 0.112, 0.115, 0.117, 0.119, 0.121, 0.123,
  0.126, 0.128,
] as const;

/** Avance de fase por frame (t·0.002 a 60 fps) y por barra (i·0.4), en
 *  muestras de IDLE_WAVE: 256/(2π) ≈ 40.7437 muestras por radián. */
const IDLE_FRAME_STEP = 1.3581;
const IDLE_BAR_STEP = 16.2975;
/** Energía del master en reposo (proporción de anillos sin audio). */
const IDLE_ENERGY = 0.06;

export interface DeckProps {
  /** Pista seleccionada (undefined = esperando señal). */
  track: Track | undefined;
  playing: boolean;
  loading: boolean;
  /** AnalyserNode del grafo de audio (null si el navegador no lo permite). */
  analyser: AnalyserNode | null;
  /** True tras la primera interacción del usuario (reproducir/seleccionar/canal). */
  hasInteracted: boolean;
  onTogglePlay: () => void;
}

/**
 * Deck oscuro del reproductor: visualizador de frecuencia en canvas con
 * 64 barras radiales (gradiente teal→amber→coral), tres anillos
 * orgánicos, núcleo solar y pulso de brillo al sonar, portado de la
 * referencia Master Debugg. El rAF corre siempre (idle o reproduciendo)
 * salvo prefers-reduced-motion: en reposo avanza la onda idle
 * precalculada y los anillos; con audio, getByteFrequencyData escribe
 * únicamente en el canvas (nunca dispara render React por frame). El
 * dibujo vive en un espacio lógico 400×400 que se escala y centra al
 * tamaño real del canvas; al redimensionar (ventana o breakpoint) se
 * re-mide y repinta (resize + ResizeObserver). La limpieza usa
 * coordenadas reales con transform identidad para no dejar restos.
 * Con reduced-motion se dibuja un único frame idle estable y legible.
 * El botón central alterna play/pausa y muestra un spinner mientras
 * carga.
 */
export default function Deck({
  track,
  playing,
  loading,
  analyser,
  hasInteracted,
  onTogglePlay,
}: DeckProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    /** Ajusta el buffer físico al tamaño CSS y aplica la transformación
     *  lógica 400×400 centrada (scale uniforme + offset de centrado). */
    const applyTransform = () => {
      const w = canvas.clientWidth || 400;
      const h = canvas.clientHeight || 400;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      // El dibujo vive en un espacio lógico 400×400 centrado en (200, 200).
      // Se escala de forma uniforme al tamaño real del canvas y se centra:
      // sin esto, el aro quedaría pegado a la esquina superior izquierda.
      const scale = Math.min(w, h) / 400;
      const offsetX = (w - 400 * scale) / 2;
      const offsetY = (h - 400 * scale) / 2;
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
    };

    /** Limpia el canvas con coordenadas REALES (transform identidad), no
     *  con la transformación lógica: así no quedan restos fuera del aro. */
    const clearReal = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    };

    /** Dibuja el fondo: anillos orgánicos (fase), núcleo solar y pulso. */
    const drawBase = (phase: number, energy: number) => {
      clearReal();
      ctx.lineWidth = 1;
      const [r3, r2, r1] = RINGS[phase];
      for (const [r, color] of [
        [r3, RING_COLORS[0]],
        [r2, RING_COLORS[1]],
        [r1, RING_COLORS[2]],
      ] as const) {
        ctx.beginPath();
        ctx.arc(200, 200, r, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.stroke();
      }
      // Núcleo solar: gradiente radial ámbar → coral → transparente.
      // El ámbar se atenúa al pausar (Master: "cc" sonando, "55" en reposo).
      const core = ctx.createRadialGradient(200, 200, 0, 200, 200, CORE_R);
      core.addColorStop(0, playing ? AMBER_CC : AMBER_55);
      core.addColorStop(0.7, CORAL_22);
      core.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(200, 200, CORE_R, 0, Math.PI * 2);
      ctx.fillStyle = core;
      ctx.fill();
      // Pulso de brillo al sonar (Master: arco R·(0.5 + energy·0.9), ámbar 6 %).
      if (playing) {
        ctx.beginPath();
        ctx.arc(200, 200, CORE_R + energy * (R * 0.9), 0, Math.PI * 2);
        ctx.fillStyle = AMBER_10;
        ctx.fill();
      }
    };

    /** Dibuja las 64 barras con gradiente teal→amber→coral por barra. */
    const drawBars = (valueFor: (i: number) => number) => {
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.85;
      for (let i = 0; i < UX.length; i++) {
        const len = BASE_LEN + valueFor(i) * MAX_LEN;
        const x1 = 200 + UX[i] * INTERIOR;
        const y1 = 200 + UY[i] * INTERIOR;
        const x2 = 200 + UX[i] * (INTERIOR + len);
        const y2 = 200 + UY[i] * (INTERIOR + len);
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, TEAL);
        grad.addColorStop(0.6, AMBER);
        grad.addColorStop(1, CORAL);
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Aplica la transformación lógica 400×400 centrada antes de dibujar.
    applyTransform();

    /** Un frame idle estable (reduced-motion o sin rAF): onda en frame 0. */
    const drawStatic = () => {
      drawBase(0, IDLE_ENERGY);
      drawBars((i) => IDLE_WAVE[Math.floor((i * IDLE_BAR_STEP) % IDLE_WAVE.length)]);
    };

    // El loop corre SIEMPRE (idle o reproduciendo) salvo reduced-motion:
    // como el master, el deck respira incluso pausado. Con audio real se
    // lee el AnalyserNode; sin él, la onda idle precalculada avanza un
    // frame por rAF (picos que se desplazan, nunca una corona fija).
    const animate = !reduceMotion && typeof window.requestAnimationFrame === 'function';

    let raf = 0;
    if (animate) {
      const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
      let frame = 0;
      const tick = () => {
        frame += 1;
        if (analyser && playing && data) {
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const energy = sum / data.length / 255;
          drawBase(frame % RINGS.length, energy);
          drawBars((i) => {
            const bin = Math.min(data.length - 1, Math.floor((i / UX.length) * data.length));
            return data[bin] / 255;
          });
        } else {
          drawBase(frame % RINGS.length, IDLE_ENERGY);
          drawBars((i) => {
            const idx = Math.floor(
              (frame * IDLE_FRAME_STEP + i * IDLE_BAR_STEP) % IDLE_WAVE.length,
            );
            return IDLE_WAVE[idx];
          });
        }
        raf = window.requestAnimationFrame(tick);
      };
      raf = window.requestAnimationFrame(tick);
    } else {
      drawStatic();
    }

    /** Redibuja al redimensionar (ventana o breakpoint): re-mide, re-aplica
     *  la transformación y repinta. Con ciclo vivo, el siguiente frame
     *  repinta con la nueva transform; sin ciclo, se repinta al instante. */
    const onResize = () => {
      applyTransform();
      if (!raf) drawStatic();
    };
    window.addEventListener('resize', onResize);
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(onResize) : null;
    ro?.observe(canvas);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
    };
  }, [analyser, playing]);

  // Sin interacción (o sin pista) el deck espera señal; tras la primera
  // interacción muestra el modo de la pista, como la referencia Master
  // Debugg (paisaje sonoro / organic house), nunca el título.
  const hzLabel =
    !track || !hasInteracted
      ? '— Hz · esperando señal'
      : `${track.hz} Hz · ${track.mode === 'house' ? 'organic house' : 'paisaje sonoro'}`;

  return (
    <div className={`${styles.deck}${playing ? ` ${styles.isPlaying}` : ''}`}>
      <canvas
        ref={canvasRef}
        className={styles.viz}
        width={400}
        height={400}
        data-deck-canvas
        aria-hidden="true"
      />

      <button
        type="button"
        className={styles.play}
        onClick={onTogglePlay}
        disabled={loading}
        aria-label={
          loading ? 'Cargando audio' : playing ? 'Pausar pista' : 'Reproducir pista seleccionada'
        }
      >
        {loading ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : playing ? (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className={styles.meta}>
        <span className={styles.hz}>{hzLabel}</span>
        <span className={styles.live}>EN VIVO</span>
      </div>
    </div>
  );
}
