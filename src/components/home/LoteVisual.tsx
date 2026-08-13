/**
 * Visuales deterministas de TUESTE TREE (SVG puro, sin imágenes
 * externas, base64 ni aleatoriedad). Paleta de floración del mockup:
 * cielo lavanda, luna crema, colinas orgánicas estratificadas y
 * cafetos lima con cerezas.
 *
 * El paisaje principal vive ahora en LoteCanvas (Canvas 2D animado);
 * aquí queda el árbol de seguimiento (Arbol) y una miniatura estática
 * (LoteThumb) para los logros de la bitácora.
 */

/**
 * Miniatura estática del lote para la bitácora (sin animación): cielo,
 * luna, colinas y cafetos en una versión simplificada y determinista.
 */
export function LoteThumb({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 60"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
      focusable="false"
      data-lote-thumb
    >
      <defs>
        <linearGradient id="tt-thumb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f6fb0" />
          <stop offset="1" stopColor="#d8c79a" />
        </linearGradient>
      </defs>
      <rect width="60" height="60" fill="url(#tt-thumb-sky)" />
      <circle cx="16" cy="15" r="5" fill="#FFF3D6" opacity="0.85" />
      <path d="M0 30 C 10 26 20 28 30 26 C 40 24 50 27 60 25 L 60 60 L 0 60 Z" fill="#2a5a55" />
      <path d="M0 40 C 12 37 24 39 36 37 C 46 35 54 38 60 36 L 60 60 L 0 60 Z" fill="#1f4641" />
      <path d="M0 49 C 12 46 24 48 36 46 C 46 44 54 47 60 45 L 60 60 L 0 60 Z" fill="#15332f" />
      <g stroke="#bfe06a" strokeWidth="1.4" fill="none" strokeLinecap="round">
        <path d="M12 44 q -4 -6 -3 -12" />
        <path d="M30 43 q -4 -7 -3 -14" />
        <path d="M48 44 q -4 -6 -3 -12" />
      </g>
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
