/**
 * Sol Tueste en SVG inline (sin raster, sin base64): disco + 8 rayos
 * con coordenadas literales. Para el divisor del hero, el pie del
 * portal y cualquier ornamento donde no aplique el PNG de marca.
 */
export default function SunGlyph({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4.6" />
      <line x1="12" y1="19.4" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4.6" y2="12" />
      <line x1="19.4" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="4.93" x2="6.77" y2="6.77" />
      <line x1="17.23" y1="17.23" x2="19.07" y2="19.07" />
      <line x1="4.93" y1="19.07" x2="6.77" y2="17.23" />
      <line x1="17.23" y1="6.77" x2="19.07" y2="4.93" />
    </svg>
  );
}
