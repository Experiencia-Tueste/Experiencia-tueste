/**
 * Visuales deterministas de TUESTE TREE (SVG puro, sin imágenes
 * externas, base64 ni aleatoriedad). Paleta de floración del mockup:
 * cielo lila claro, montañas verde azulado y árboles lima.
 */

/** Un árbol del lote: tronco, ramas y cerezas, con coordenadas fijas. */
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
    <g transform={`translate(${x},${y})`}>
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

/** Filas de árboles del lote (tres profundidades, coordenadas fijas). */
const FILAS: ReadonlyArray<{
  y: number;
  h: number;
  n: number;
  x0: number;
  paso: number;
  cerezaPar: boolean;
}> = [
  { y: 350, h: 30, n: 7, x0: 35, paso: 55, cerezaPar: true },
  { y: 395, h: 38, n: 6, x0: 60, paso: 62, cerezaPar: false },
  { y: 440, h: 46, n: 5, x0: 75, paso: 70, cerezaPar: true },
];

const LEAF = '#bfe06a';
const CHERRY = '#FFE8BF';

/**
 * Paisaje del Lote 000 en floración: cielo con gradiente, sol, tres
 * capas de montañas, filas de árboles con cerezas y el camino a la
 * finca. Coordenadas estáticas precalculadas (render determinista).
 */
export function LotePaisaje({ className }: { className?: string }) {
  const sol = 292;
  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="tt-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f6fb0" />
          <stop offset="1" stopColor="#d8c79a" />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#tt-sky)" />
      <circle cx={sol} cy={176} r="52" fill="#fff" opacity="0.12" />
      <circle cx={sol} cy={176} r="32" fill="#FFF3D6" opacity="0.9" />

      {/* Niebla del valle */}
      <ellipse cx="90" cy="248" rx="180" ry="13" fill="#fff" opacity="0.08" />
      <ellipse cx="300" cy="288" rx="150" ry="13" fill="#fff" opacity="0.06" />
      <ellipse cx="150" cy="330" rx="120" ry="13" fill="#fff" opacity="0.05" />

      {/* Montañas: fondo, media y frente */}
      <polygon
        points="0,270 30,232 60,246 95,205 130,228 170,196 210,224 250,200 290,226 330,208 370,236 400,214 400,270"
        fill="#2a5a55"
      />
      <polygon
        points="0,320 40,282 80,300 120,264 165,290 205,258 245,286 290,262 330,290 370,270 400,292 400,320"
        fill="#1f4641"
      />
      <polygon
        points="0,380 50,344 100,366 150,330 200,356 250,322 300,348 350,330 400,352 400,380"
        fill="#15332f"
      />

      {/* Lote de árboles */}
      {FILAS.map((f, fi) =>
        Array.from({ length: f.n }, (_, i) => (
          <Plantita
            key={`${fi}-${i}`}
            x={Math.round(f.x0 + i * f.paso)}
            y={f.y}
            h={f.h}
            leaf={LEAF}
            cherry={CHERRY}
            conCereza={f.cerezaPar ? i % 2 === 0 : i % 2 === 1}
          />
        )),
      )}

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
