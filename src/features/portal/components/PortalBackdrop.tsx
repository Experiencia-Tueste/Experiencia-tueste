import styles from './PortalBackdrop.module.css';

/**
 * Fondo editorial del portal: la ilustración `portal-background-v1.webp`
 * (decorativa, vía CSS background-image) con una capa oscura mínima que
 * preserva el contraste del texto. En escritorio se ve panorámica con
 * los laterales turquesa/coral; en móvil se centra sin provocar
 * overflow. Puramente decorativo.
 */
export default function PortalBackdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <span className={styles.scrim} />
    </div>
  );
}
