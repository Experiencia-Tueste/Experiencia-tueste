/**
 * Visuales deterministas de TUESTE TREE (SVG puro, sin imágenes
 * externas, base64 ni aleatoriedad). Paleta de floración del mockup:
 * cielo lavanda, luna crema, colinas orgánicas estratificadas y
 * cafetos lima con cerezas.
 */

/** Un cafeto del lote: tronco, ramas y cereza, con coordenadas fijas. */
function Plantita({
  x,
  y,
  h,
  leaf,
  cherry,
  conCereza,
}: {
  x: number;
  y: number;
  h: number;
  leaf: string;
  cherry: string;
  conCereza: boolean;
}) {
  const tronco = `M0 0 C -1 ${Math.round(-h * 0.5)} 1 ${Math.round(-h * 0.8)} 0 ${-h}`;
  return (
    <g transform={`translate(${x},${y})`} data-cafeto>
      <path d={tronco} stroke={leaf} strokeWidth="2.2" fill="none" />
      {[1, 2, 3].map((k) => {
        const ly = Math.round(-(h * k) / 4);
        const sg = k % 2 ? 1 : -1;
        return (
          <path
            key={k}
            d={`M0 ${ly} q ${sg * 9} -4 ${sg * 15} 2`}
            stroke={leaf}
            strokeWidth="2"
            fill="none"
          />
        );
      })}
      {conCereza ? <circle cx={-3} cy={Math.round(-h * 0.6)} r="2.6" fill={cherry} /> : null}
    </g>
  );
}

/**
 * Cafetos del lote: tres planos con variación fija predefinida de
 * posición, escala y altura (sin aleatoriedad). Cada entrada es un
 * literal: x, y, altura y si lleva cereza.
 */
const CAFETOS: ReadonlyArray<{ x: number; y: number; h: number; cereza: boolean }> = [
  // Plano lejano (más pequeños, hacia el horizonte)
  { x: 42, y: 332, h: 22, cereza: true },
  { x: 96, y: 330, h: 26, cereza: false },
  { x: 148, y: 334, h: 24, cereza: true },
  { x: 202, y: 331, h: 28, cereza: false },
  { x: 256, y: 333, h: 23, cereza: true },
  { x: 308, y: 330, h: 27, cereza: false },
  { x: 358, y: 332, h: 25, cereza: true },
  // Plano medio
  { x: 30, y: 372, h: 32, cereza: false },
  { x: 82, y: 370, h: 36, cereza: true },
  { x: 134, y: 374, h: 31, cereza: false },
  { x: 186, y: 371, h: 35, cereza: true },
  { x: 238, y: 373, h: 33, cereza: false },
  { x: 290, y: 370, h: 37, cereza: true },
  { x: 342, y: 372, h: 32, cereza: false },
  // Plano cercano (más altos, al frente)
  { x: 30, y: 412, h: 42, cereza: true },
  { x: 84, y: 410, h: 46, cereza: false },
  { x: 138, y: 414, h: 40, cereza: true },
  { x: 192, y: 411, h: 45, cereza: false },
  { x: 246, y: 413, h: 43, cereza: true },
  { x: 300, y: 410, h: 47, cereza: false },
  { x: 354, y: 412, h: 41, cereza: true },
];

const LEAF = '#bfe06a';
const CHERRY = '#FFE8BF';

/**
 * Paisaje del Lote 000 en floración, fiel al mockup: cielo lavanda,
 * luna crema hacia el tercio superior izquierdo, colinas orgánicas
 * estratificadas (curvas suaves, sin triángulos), niebla del valle,
 * cafetos en tres planos y el camino a la finca. Coordenadas estáticas
 * precalculadas (render determinista, sin trigonometría en el módulo).
 */
export function LotePaisaje({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
      focusable="false"
      data-lote
    >
      <defs>
        <linearGradient id="tt-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f6fb0" />
          <stop offset="1" stopColor="#d8c79a" />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#tt-sky)" />

      {/* Luna crema hacia el tercio superior izquierdo (del mockup) */}
      <circle cx="92" cy="118" r="50" fill="#fff" opacity="0.1" data-luna-halo />
      <circle cx="92" cy="118" r="30" fill="#FFF3D6" opacity="0.85" data-luna />

      {/* Niebla del valle */}
      <ellipse cx="90" cy="248" rx="180" ry="13" fill="#fff" opacity="0.08" />
      <ellipse cx="300" cy="288" rx="150" ry="13" fill="#fff" opacity="0.06" />
      <ellipse cx="150" cy="330" rx="120" ry="13" fill="#fff" opacity="0.05" />

      {/* Colinas orgánicas: fondo, media y frente (curvas suaves) */}
      <path
        d="M0 268 C 60 238 130 252 200 240 C 270 228 340 246 400 232 L 400 500 L 0 500 Z"
        fill="#2a5a55"
        data-capa="fondo"
      />
      <path
        d="M0 320 C 70 290, 150 306, 220 294 C 290 282, 350 300, 400 288 L 400 500 L 0 500 Z"
        fill="#1f4641"
        data-capa="media"
      />
      <path
        d="M0 378 C 80 350, 160 366, 240 354 C 310 344, 360 360, 400 350 L 400 500 L 0 500 Z"
        fill="#15332f"
        data-capa="frente"
      />

      {/* Cafetos del lote (tres planos, alturas no uniformes) */}
      {CAFETOS.map((c, i) => (
        <Plantita
          key={i}
          x={c.x}
          y={c.y}
          h={c.h}
          leaf={LEAF}
          cherry={CHERRY}
          conCereza={c.cereza}
        />
      ))}

      {/* Camino a la finca */}
      <path
        d="M0 470 C 90 450 160 430 200 400 C 240 370 260 350 250 330"
        stroke={LEAF}
        strokeWidth="1.4"
        fill="none"
        opacity="0.45"
      />
    </svg>
  );
}

/**
 * Árbol de seguimiento (del mockup, `ttTree`): ramas y cerezas según el
 * progreso `pct` (0–100). Determinista: mismo progreso, mismo árbol.
 */
export function Arbol({ pct }: { pct: number }) {
  const hojas = Math.round(4 + (pct / 100) * 4);
  const cerezas = Math.round((pct / 100) * 6);
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g transform="translate(50,88)">
        <path d="M0 0 C -3 -30 3 -50 0 -68" stroke="#19c9b8" strokeWidth="3.4" fill="none" />
        {Array.from({ length: hojas }, (_, k) => {
          const n = k + 1;
          const ly = -12 - n * 7;
          const sg = n % 2 ? 1 : -1;
          return (
            <path
              key={n}
              d={`M0 ${ly} q ${sg * 12} -5 ${sg * 20} 3`}
              stroke="#19c9b8"
              strokeWidth="3"
              fill="none"
            />
          );
        })}
        {Array.from({ length: cerezas }, (_, k) => {
          const c = k + 1;
          const cy = -20 - c * 8;
          const sg = c % 2 ? 1 : -1;
          return <circle key={c} cx={sg * (6 + (c % 3) * 2)} cy={cy} r="3.1" fill="#ed5f6f" />;
        })}
      </g>
    </svg>
  );
}
