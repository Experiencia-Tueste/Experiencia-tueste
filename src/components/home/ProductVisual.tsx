import Image from 'next/image';

/**
 * Visual determinista de producto para la tienda (SVG puro, sin
 * imágenes externas, base64 ni aleatoriedad). Un icono por categoría
 * del catálogo, dibujado con la paleta de marca.
 *
 * Cuando `imageSrc` apunta a un asset local de `public/images/merch/`,
 * se muestra esa fotografía editorial con `next/image`; mientras el
 * asset no exista, se conserva el SVG de categoría (fallback elegante,
 * sin romper el layout).
 */

const AMBER = '#fba922';
const TEAL = '#19c9b8';
const CREAM = '#ffe8bf';
const CORAL = '#ff6f86';

/** Vinilo translúcido ámbar con etiqueta central. */
function Vinilo() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <circle cx="60" cy="60" r="46" fill="rgba(251,169,34,.14)" stroke={AMBER} strokeWidth="2" />
      <circle cx="60" cy="60" r="34" fill="none" stroke={AMBER} strokeWidth="1" opacity=".5" />
      <circle cx="60" cy="60" r="22" fill="rgba(251,169,34,.2)" />
      <circle cx="60" cy="60" r="5" fill={CREAM} />
    </svg>
  );
}

/** Cassette con ventana y ruedas. */
function Cassette() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <rect
        x="24"
        y="34"
        width="72"
        height="52"
        rx="8"
        fill="rgba(25,201,184,.1)"
        stroke={TEAL}
        strokeWidth="2"
      />
      <rect x="36" y="46" width="48" height="16" rx="3" fill="rgba(25,201,184,.22)" />
      <circle cx="44" cy="70" r="6" fill="none" stroke={TEAL} strokeWidth="2" />
      <circle cx="76" cy="70" r="6" fill="none" stroke={TEAL} strokeWidth="2" />
      <circle cx="44" cy="70" r="2" fill={TEAL} />
      <circle cx="76" cy="70" r="2" fill={TEAL} />
    </svg>
  );
}

/** Taza de gres con asa y vapor. */
function Taza() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <path
        d="M34 52h44v22a22 22 0 01-22 22h-0a22 22 0 01-22-22z"
        fill="rgba(255,111,134,.12)"
        stroke={CORAL}
        strokeWidth="2"
      />
      <path d="M78 56h8a10 10 0 010 20h-8" fill="none" stroke={CORAL} strokeWidth="2" />
      <path
        d="M44 34 q-4 -8 2 -12"
        fill="none"
        stroke={CORAL}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M56 32 q-4 -8 2 -12"
        fill="none"
        stroke={CORAL}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M68 34 q-4 -8 2 -12"
        fill="none"
        stroke={CORAL}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Rayos del sol de la camiseta: coordenadas estáticas (cada 45°). */
const RAYOS_SOL: ReadonlyArray<readonly [number, number, number, number]> = [
  [71, 58, 76, 58],
  [67.8, 65.8, 71.3, 69.3],
  [60, 69, 60, 74],
  [52.2, 65.8, 48.7, 69.3],
  [49, 60, 44, 60],
  [52.2, 50.2, 48.7, 46.7],
  [60, 47, 60, 42],
  [67.8, 50.2, 71.3, 46.7],
];

/** Camiseta con el sol Tueste. */
function Camiseta() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <path
        d="M44 30 L28 40 L20 58 L34 66 L38 60 L38 92 L82 92 L82 60 L86 66 L100 58 L92 40 L76 30 Q60 38 44 30z"
        fill="rgba(138,139,208,.12)"
        stroke="#8a8bd0"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="58" r="9" fill={CREAM} />
      {RAYOS_SOL.map(([x1, y1, x2, y2]) => (
        <line
          key={`${x1}-${y1}-${x2}-${y2}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={CREAM}
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

/** Lámina con espectrograma. */
function Print() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <rect
        x="26"
        y="26"
        width="68"
        height="68"
        rx="6"
        fill="rgba(25,201,184,.08)"
        stroke={TEAL}
        strokeWidth="2"
      />
      <path
        d="M36 78 q8 -18 16 -6 t16 -18 t16 6 t16 -14"
        fill="none"
        stroke={AMBER}
        strokeWidth="2"
      />
      <path
        d="M36 88 q8 -14 16 -4 t16 -14 t16 4 t16 -10"
        fill="none"
        stroke={TEAL}
        strokeWidth="2"
        opacity=".7"
      />
    </svg>
  );
}

/** Bolsa de café con grano. */
function Cafe() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <path
        d="M40 30 h40 l6 14 v46 a8 8 0 01-8 8 h-36 a8 8 0 01-8-8 v-46z"
        fill="rgba(251,169,34,.12)"
        stroke={AMBER}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M40 30 h40 l-4 10 h-32z" fill="rgba(251,169,34,.25)" />
      <ellipse cx="60" cy="62" rx="9" ry="12" fill={CREAM} opacity=".9" />
      <path d="M60 50 q6 6 0 12 q-6 6 0 12" fill="none" stroke={AMBER} strokeWidth="1.6" />
    </svg>
  );
}

const VISUALES: Record<string, () => React.ReactElement> = {
  vinyl: Vinilo,
  cassette: Cassette,
  cup: Taza,
  tee: Camiseta,
  print: Print,
  coffee: Cafe,
};

export interface ProductVisualProps {
  /** Clave `icon` del catálogo (vinyl, cassette, cup, tee, print, coffee). */
  icon: string;
  /** Asset local opcional bajo public/images/merch/ (fotografía editorial). */
  imageSrc?: string;
  /** Nombre del producto para el texto alternativo de la imagen. */
  name?: string;
}

/**
 * Visual de producto: fotografía local cuando `imageSrc` existe; si no,
 * el ícono SVG de la categoría (o el vinilo como último respaldo).
 */
export default function ProductVisual({ icon, imageSrc, name }: ProductVisualProps) {
  if (imageSrc) {
    return (
      <Image
        src={imageSrc}
        alt={`Producto de Tueste: ${name ?? 'objeto del universo Origen Tostado'}`}
        fill
        sizes="(max-width: 780px) 100vw, 25vw"
        className="product-art-image"
      />
    );
  }
  const Visual = VISUALES[icon] ?? Vinilo;
  return <Visual />;
}
