import styles from './ExperienceArtworkMotion.module.css';

/**
 * Remates radiales alineados con las ondas de color del arte WebP.
 * El viewBox coincide con el tamaño real de la imagen (1448 × 1086) y
 * el centro óptico del vinilo es (724, 500). Cada remate es un
 * segmento literal desde el extremo exterior de su onda de color
 * hacia dentro; no rotan (la rotación desalinearía los ejes con el
 * arte). Respiran con stroke-dasharray (pathLength="1") manteniendo
 * fijo el extremo exterior: crecen y se encogen hacia el vinilo.
 * Coordenadas, duraciones y delays son literales deterministas: sin
 * trigonometría, azar ni lógica dinámica en runtime.
 */
export const RAY_CAPS = [
  { x1: 724.0, y1: 122.0, x2: 724.0, y2: 226.0, duration: '6.2s', delay: '-0.0s', tint: 'cream' },
  { x1: 761.1, y1: 123.8, x2: 750.9, y2: 227.3, duration: '5.1s', delay: '-1.4s', tint: 'teal' },
  { x1: 797.7, y1: 129.3, x2: 777.5, y2: 231.3, duration: '7.4s', delay: '-2.7s', tint: 'violet' },
  { x1: 833.7, y1: 138.3, x2: 803.5, y2: 237.8, duration: '4.6s', delay: '-0.8s', tint: 'coral' },
  { x1: 868.7, y1: 150.8, x2: 828.9, y2: 246.9, duration: '6.8s', delay: '-3.2s', tint: 'cream' },
  { x1: 902.2, y1: 166.6, x2: 853.2, y2: 258.4, duration: '5.6s', delay: '-1.9s', tint: 'teal' },
  { x1: 934.0, y1: 185.7, x2: 876.2, y2: 272.2, duration: '7.9s', delay: '-4.1s', tint: 'violet' },
  { x1: 963.8, y1: 207.8, x2: 897.8, y2: 288.2, duration: '4.9s', delay: '-2.3s', tint: 'coral' },
  { x1: 991.3, y1: 232.7, x2: 917.7, y2: 306.3, duration: '6.2s', delay: '-0.0s', tint: 'cream' },
  { x1: 1016.2, y1: 260.2, x2: 935.8, y2: 326.2, duration: '5.1s', delay: '-1.4s', tint: 'teal' },
  { x1: 1038.3, y1: 290.0, x2: 951.8, y2: 347.8, duration: '7.4s', delay: '-2.7s', tint: 'violet' },
  { x1: 1057.4, y1: 321.8, x2: 965.6, y2: 370.8, duration: '4.6s', delay: '-0.8s', tint: 'coral' },
  { x1: 1073.2, y1: 355.3, x2: 977.1, y2: 395.1, duration: '6.8s', delay: '-3.2s', tint: 'cream' },
  { x1: 1085.7, y1: 390.3, x2: 986.2, y2: 420.5, duration: '5.6s', delay: '-1.9s', tint: 'teal' },
  { x1: 1094.7, y1: 426.3, x2: 992.7, y2: 446.5, duration: '7.9s', delay: '-4.1s', tint: 'violet' },
  { x1: 1100.2, y1: 462.9, x2: 996.7, y2: 473.1, duration: '4.9s', delay: '-2.3s', tint: 'coral' },
  { x1: 1102.0, y1: 500.0, x2: 998.0, y2: 500.0, duration: '6.2s', delay: '-0.0s', tint: 'cream' },
  { x1: 1100.2, y1: 537.1, x2: 996.7, y2: 526.9, duration: '5.1s', delay: '-1.4s', tint: 'teal' },
  { x1: 1094.7, y1: 573.7, x2: 992.7, y2: 553.5, duration: '7.4s', delay: '-2.7s', tint: 'violet' },
  { x1: 1085.7, y1: 609.7, x2: 986.2, y2: 579.5, duration: '4.6s', delay: '-0.8s', tint: 'coral' },
  { x1: 1073.2, y1: 644.7, x2: 977.1, y2: 604.9, duration: '6.8s', delay: '-3.2s', tint: 'cream' },
  { x1: 1057.4, y1: 678.2, x2: 965.6, y2: 629.2, duration: '5.6s', delay: '-1.9s', tint: 'teal' },
  { x1: 1038.3, y1: 710.0, x2: 951.8, y2: 652.2, duration: '7.9s', delay: '-4.1s', tint: 'violet' },
  { x1: 1016.2, y1: 739.8, x2: 935.8, y2: 673.8, duration: '4.9s', delay: '-2.3s', tint: 'coral' },
  { x1: 991.3, y1: 767.3, x2: 917.7, y2: 693.7, duration: '6.2s', delay: '-0.0s', tint: 'cream' },
  { x1: 963.8, y1: 792.2, x2: 897.8, y2: 711.8, duration: '5.1s', delay: '-1.4s', tint: 'teal' },
  { x1: 934.0, y1: 814.3, x2: 876.2, y2: 727.8, duration: '7.4s', delay: '-2.7s', tint: 'violet' },
  { x1: 902.2, y1: 833.4, x2: 853.2, y2: 741.6, duration: '4.6s', delay: '-0.8s', tint: 'coral' },
  { x1: 868.7, y1: 849.2, x2: 828.9, y2: 753.1, duration: '6.8s', delay: '-3.2s', tint: 'cream' },
  { x1: 833.7, y1: 861.7, x2: 803.5, y2: 762.2, duration: '5.6s', delay: '-1.9s', tint: 'teal' },
  { x1: 797.7, y1: 870.7, x2: 777.5, y2: 768.7, duration: '7.9s', delay: '-4.1s', tint: 'violet' },
  { x1: 761.1, y1: 876.2, x2: 750.9, y2: 772.7, duration: '4.9s', delay: '-2.3s', tint: 'coral' },
  { x1: 724.0, y1: 878.0, x2: 724.0, y2: 774.0, duration: '6.2s', delay: '-0.0s', tint: 'cream' },
  { x1: 686.9, y1: 876.2, x2: 697.1, y2: 772.7, duration: '5.1s', delay: '-1.4s', tint: 'teal' },
  { x1: 650.3, y1: 870.7, x2: 670.5, y2: 768.7, duration: '7.4s', delay: '-2.7s', tint: 'violet' },
  { x1: 614.3, y1: 861.7, x2: 644.5, y2: 762.2, duration: '4.6s', delay: '-0.8s', tint: 'coral' },
  { x1: 579.3, y1: 849.2, x2: 619.1, y2: 753.1, duration: '6.8s', delay: '-3.2s', tint: 'cream' },
  { x1: 545.8, y1: 833.4, x2: 594.8, y2: 741.6, duration: '5.6s', delay: '-1.9s', tint: 'teal' },
  { x1: 514.0, y1: 814.3, x2: 571.8, y2: 727.8, duration: '7.9s', delay: '-4.1s', tint: 'violet' },
  { x1: 484.2, y1: 792.2, x2: 550.2, y2: 711.8, duration: '4.9s', delay: '-2.3s', tint: 'coral' },
  { x1: 456.7, y1: 767.3, x2: 530.3, y2: 693.7, duration: '6.2s', delay: '-0.0s', tint: 'cream' },
  { x1: 431.8, y1: 739.8, x2: 512.2, y2: 673.8, duration: '5.1s', delay: '-1.4s', tint: 'teal' },
  { x1: 409.7, y1: 710.0, x2: 496.2, y2: 652.2, duration: '7.4s', delay: '-2.7s', tint: 'violet' },
  { x1: 390.6, y1: 678.2, x2: 482.4, y2: 629.2, duration: '4.6s', delay: '-0.8s', tint: 'coral' },
  { x1: 374.8, y1: 644.7, x2: 470.9, y2: 604.9, duration: '6.8s', delay: '-3.2s', tint: 'cream' },
  { x1: 362.3, y1: 609.7, x2: 461.8, y2: 579.5, duration: '5.6s', delay: '-1.9s', tint: 'teal' },
  { x1: 353.3, y1: 573.7, x2: 455.3, y2: 553.5, duration: '7.9s', delay: '-4.1s', tint: 'violet' },
  { x1: 347.8, y1: 537.1, x2: 451.3, y2: 526.9, duration: '4.9s', delay: '-2.3s', tint: 'coral' },
  { x1: 346.0, y1: 500.0, x2: 450.0, y2: 500.0, duration: '6.2s', delay: '-0.0s', tint: 'cream' },
  { x1: 347.8, y1: 462.9, x2: 451.3, y2: 473.1, duration: '5.1s', delay: '-1.4s', tint: 'teal' },
  { x1: 353.3, y1: 426.3, x2: 455.3, y2: 446.5, duration: '7.4s', delay: '-2.7s', tint: 'violet' },
  { x1: 362.3, y1: 390.3, x2: 461.8, y2: 420.5, duration: '4.6s', delay: '-0.8s', tint: 'coral' },
  { x1: 374.8, y1: 355.3, x2: 470.9, y2: 395.1, duration: '6.8s', delay: '-3.2s', tint: 'cream' },
  { x1: 390.6, y1: 321.8, x2: 482.4, y2: 370.8, duration: '5.6s', delay: '-1.9s', tint: 'teal' },
  { x1: 409.7, y1: 290.0, x2: 496.2, y2: 347.8, duration: '7.9s', delay: '-4.1s', tint: 'violet' },
  { x1: 431.8, y1: 260.2, x2: 512.2, y2: 326.2, duration: '4.9s', delay: '-2.3s', tint: 'coral' },
  { x1: 456.7, y1: 232.7, x2: 530.3, y2: 306.3, duration: '6.2s', delay: '-0.0s', tint: 'cream' },
  { x1: 484.2, y1: 207.8, x2: 550.2, y2: 288.2, duration: '5.1s', delay: '-1.4s', tint: 'teal' },
  { x1: 514.0, y1: 185.7, x2: 571.8, y2: 272.2, duration: '7.4s', delay: '-2.7s', tint: 'violet' },
  { x1: 545.8, y1: 166.6, x2: 594.8, y2: 258.4, duration: '4.6s', delay: '-0.8s', tint: 'coral' },
  { x1: 579.3, y1: 150.8, x2: 619.1, y2: 246.9, duration: '6.8s', delay: '-3.2s', tint: 'cream' },
  { x1: 614.3, y1: 138.3, x2: 644.5, y2: 237.8, duration: '5.6s', delay: '-1.9s', tint: 'teal' },
  { x1: 650.3, y1: 129.3, x2: 670.5, y2: 231.3, duration: '7.9s', delay: '-4.1s', tint: 'violet' },
  { x1: 686.9, y1: 123.8, x2: 697.1, y2: 227.3, duration: '4.9s', delay: '-2.3s', tint: 'coral' },
] as const;

export type RayTint = (typeof RAY_CAPS)[number]['tint'];

const TINT_CLASS: Record<RayTint, string> = {
  cream: styles.rayCream,
  teal: styles.rayTeal,
  violet: styles.rayViolet,
  coral: styles.rayCoral,
};

/**
 * Animación ambiental de la tarjeta Experiencia — puramente decorativa.
 *
 * Dos capas SVG muy sutiles sobre el arte WebP (que sigue siendo el
 * protagonista), inspiradas en ondas sonoras:
 *
 * - Remates radiales: 64 palitos claros sobre los ejes de las ondas de
 *   color del arte, que respiran desde su extremo exterior fijo hacia
 *   el vinilo (stroke-dasharray con pathLength=1; sin rotación).
 * - Partículas: destellos fijos turquesa, violeta y coral con
 *   parpadeo suave.
 *
 * Todo es CSS (solo transform/opacity/stroke-dasharray) con valores
 * deterministas literales: sin Canvas, sin <audio>, sin AudioContext,
 * sin JS de animación, sin Math.random ni Date.now. Sin contenido
 * semántico: aria-hidden + focusable=false. Con
 * prefers-reduced-motion la capa queda estática.
 */
export default function ExperienceArtworkMotion() {
  return (
    <svg
      className={styles.motion}
      viewBox="0 0 1448 1086"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* ── Remates radiales sobre las ondas de color del arte ── */}
      {RAY_CAPS.map((ray, i) => (
        <line
          key={`ray-${i}`}
          className={`${styles.rayCap} ${TINT_CLASS[ray.tint]}`}
          x1={ray.x1}
          y1={ray.y1}
          x2={ray.x2}
          y2={ray.y2}
          pathLength="1"
          style={
            {
              '--ray-duration': ray.duration,
              '--ray-delay': ray.delay,
            } as React.CSSProperties
          }
        />
      ))}

      {/* ── Partículas / destellos fijos ── */}
      <circle
        className={`${styles.particle} ${styles.pTeal}`}
        cx="111"
        cy="161"
        r="5"
        style={{ '--p-dur': '6s', '--p-delay': '-0.4s' } as React.CSSProperties}
      />
      <circle
        className={`${styles.particle} ${styles.pViolet}`}
        cx="1337"
        cy="207"
        r="5"
        style={{ '--p-dur': '8s', '--p-delay': '-2.1s' } as React.CSSProperties}
      />
      <circle
        className={`${styles.particle} ${styles.pCoral}`}
        cx="141"
        cy="938"
        r="6"
        style={{ '--p-dur': '7s', '--p-delay': '-1.3s' } as React.CSSProperties}
      />
      <circle
        className={`${styles.particle} ${styles.pTeal}`}
        cx="1302"
        cy="903"
        r="5"
        style={{ '--p-dur': '9s', '--p-delay': '-3.2s' } as React.CSSProperties}
      />
      <circle
        className={`${styles.particle} ${styles.pViolet}`}
        cx="752"
        cy="106"
        r="4.5"
        style={{ '--p-dur': '5.5s', '--p-delay': '-0.9s' } as React.CSSProperties}
      />
      <circle
        className={`${styles.particle} ${styles.pCoral}`}
        cx="691"
        cy="979"
        r="4.5"
        style={{ '--p-dur': '6.5s', '--p-delay': '-2.7s' } as React.CSSProperties}
      />
      <circle
        className={`${styles.particle} ${styles.pTeal}`}
        cx="1226"
        cy="757"
        r="5"
        style={{ '--p-dur': '7.5s', '--p-delay': '-1.8s' } as React.CSSProperties}
      />
      <circle
        className={`${styles.particle} ${styles.pViolet}`}
        cx="222"
        cy="747"
        r="5"
        style={{ '--p-dur': '8.5s', '--p-delay': '-3.8s' } as React.CSSProperties}
      />
    </svg>
  );
}
