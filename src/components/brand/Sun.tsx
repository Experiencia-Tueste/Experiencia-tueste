import styles from './Sun.module.css';

/**
 * Sol Tueste · asset oficial de marca (PNG del kit del cliente, sin
 * base64 ni imágenes externas).
 *
 * Estructura separada a propósito:
 * - contenedor raíz: tamaño, layout y posicionamiento (className del
 *   consumidor, p. ej. `.herosun` con translate(-50%, -50%));
 * - elemento interno `.spin`: únicamente la rotación `spin 40s linear
 *   infinite`. La animación nunca vive en el elemento que recibe un
 *   `transform` externo, para que ambos no se pisen.
 *
 * Modo noche: sol crema; en `body.day`: sol carbón (dos imágenes, la
 * inactiva con opacity 0 — funciona en SSR sin JavaScript). Sin
 * rotación con prefers-reduced-motion. API pública conservada:
 * `className`, `decorative` y `size`.
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
    <span
      className={`${styles.sun}${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      aria-hidden={decorative || undefined}
    >
      <span className={styles.spin}>
        {/* eslint-disable-next-line @next/next/no-img-element -- asset local estático del kit oficial; next/image transformaría el src y rompería el test de lockup. */}
        <img className={styles.night} src="/brand/sol-crema.png" alt="" width={245} height={230} />
        {/* eslint-disable-next-line @next/next/no-img-element -- asset local estático del kit oficial; next/image transformaría el src y rompería el test de lockup. */}
        <img className={styles.day} src="/brand/sol-carbon.png" alt="" width={245} height={230} />
      </span>
    </span>
  );
}
