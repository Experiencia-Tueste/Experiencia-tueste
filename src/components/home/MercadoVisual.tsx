import type { MercadoAccent } from '@/features/mercado';

/** Color CSS por acento de tipo de producto (variable --mc del mockup). */
export const ACCENT_COLOR: Record<MercadoAccent, string> = {
  amber: 'var(--amber)',
  coral: 'var(--coral)',
  teal: 'var(--teal-bright)',
  purple: 'var(--purple-soft)',
};

export interface MercadoVisualProps {
  /** Marca del producto (su inicial decora la bolsa). */
  marca: string;
  accent: MercadoAccent;
}

/**
 * Visual determinista de producto del Mercado de Origen: una bolsa de
 * café con la inicial de la marca, replicando el SVG del mockup
 * (mkMedia). Sin imágenes externas, base64 ni assets descargados.
 */
export default function MercadoVisual({ marca, accent }: MercadoVisualProps) {
  const inicial = (marca.trim().charAt(0) || '?').toUpperCase();
  return (
    <svg viewBox="0 0 200 150" aria-hidden="true" className="mk-visual">
      <rect width="200" height="150" fill="rgba(13,2,16,.35)" />
      <path
        d="M70 38 h60 l8 14 v58 a8 8 0 0 1 -8 8 h-60 a8 8 0 0 1 -8 -8 v-58 z"
        fill={ACCENT_COLOR[accent]}
        opacity=".92"
      />
      <path d="M70 38 h60 l8 14 h-76 z" fill="rgba(13,2,16,.25)" />
      <rect x="62" y="52" width="76" height="10" fill="rgba(13,2,16,.18)" />
      <circle cx="100" cy="46" r="3.4" fill="rgba(13,2,16,.4)" />
      <text
        x="100"
        y="95"
        textAnchor="middle"
        fontFamily="Fraunces, Georgia, serif"
        fontSize="34"
        fontStyle="italic"
        fill="rgba(13,2,16,.55)"
      >
        {inicial}
      </text>
      <ellipse cx="100" cy="130" rx="46" ry="5" fill="rgba(13,2,16,.18)" />
    </svg>
  );
}
