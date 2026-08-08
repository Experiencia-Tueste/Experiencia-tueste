import styles from './Sun.module.css';

/**
 * Rayos del sol · coordenadas estáticas precalculadas (radio interior 13,
 * exterior 19, cada 30°). Fuera del componente para que el render sea
 * 100% determinista y no registre errores de hydration.
 */
const RAYOS: ReadonlyArray<readonly [number, number, number, number]> = [
  [37, 24, 43, 24],
  [35.3, 30.5, 40.5, 33.5],
  [30.5, 35.3, 33.5, 40.5],
  [24, 37, 24, 43],
  [17.5, 35.3, 14.5, 40.5],
  [12.7, 30.5, 7.5, 33.5],
  [11, 24, 5, 24],
  [12.7, 17.5, 7.5, 14.5],
  [17.5, 12.7, 14.5, 7.5],
  [24, 11, 24, 5],
  [30.5, 12.7, 33.5, 7.5],
  [35.3, 17.5, 40.5, 14.5],
];

/**
 * Sol Tueste · ícono de marca propio (SVG, sin base64).
 * Círculo central + 12 rayos estáticos, con rotación lenta controlada
 * por CSS. `decorative` oculta el SVG de lectores de pantalla cuando el
 * texto adyacente ya describe la marca. El tamaño se controla con `size`
 * (inline) para que los consumidores no dependan de la cascada CSS.
 */
export default function Sun({
  className,
  decorative = true,
  size = 38,
}: {
  className?: string;
  decorative?: boolean;
  size?: number;
}) {
  return (
    <svg
      className={`${styles.sun}${className ? ` ${className}` : ''}`}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      aria-hidden={decorative || undefined}
      focusable="false"
    >
      <circle cx="24" cy="24" r="9" fill="currentColor" />
      {RAYOS.map(([x1, y1, x2, y2]) => (
        <line
          key={`${x1}-${y1}-${x2}-${y2}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
