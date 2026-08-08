import styles from './EditorialTicker.module.css';

/**
 * Cinta editorial reutilizable (paridad visual con el master).
 * Cinta horizontal tipográfica continua con dos copias del mismo texto
 * (la segunda aria-hidden), separador ✦ y variantes ámbar / tenue.
 * Animación CSS lenta y determinista; estática con prefers-reduced-motion.
 * Nunca causa scroll horizontal: el contenedor recorta con overflow hidden.
 */
export interface EditorialTickerProps {
  /** Variante visual: ámbar (fondo ámbar) o tenue (contorno, texto hueco). */
  variant?: 'amber' | 'dim';
  /** Invierte la dirección de la animación (como el master .rev). */
  reverse?: boolean;
  /** Inclina la cinta hacia el otro lado (master .amber.alt). */
  alt?: boolean;
}

export const TICKER_TEXT =
  'El café también se escucha ✦ 111 Hz → 528 Hz ✦ Organic House & Ambient ✦ Eje Cafetero · Colombia ✦ Tueste · Origen Tostado ✦';

export default function EditorialTicker({
  variant = 'amber',
  reverse = false,
  alt = false,
}: EditorialTickerProps) {
  const cls = [
    styles.ticker,
    variant === 'dim' ? styles.dim : styles.amber,
    alt ? styles.alt : '',
    reverse ? styles.reverse : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrap}>
      <div
        className={cls}
        data-variant={variant}
        data-reverse={reverse || undefined}
        data-alt={alt || undefined}
      >
        <div className={styles.row}>
          <span className={styles.copy} data-copy>
            {TICKER_TEXT}
          </span>
          <span className={styles.copy} data-copy aria-hidden="true">
            {TICKER_TEXT}
          </span>
        </div>
      </div>
    </div>
  );
}
