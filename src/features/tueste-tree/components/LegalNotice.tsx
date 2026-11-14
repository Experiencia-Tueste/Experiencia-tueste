import { LEGAL_AMPLIO } from '../data/content';
import styles from '../tueste-tree.module.css';

/**
 * Aviso visible, sobrio y estático: la adopción no es una inversión y
 * se compra en la tienda. Se muestra al final
 * de ambas rutas de Tueste Tree.
 */
export default function LegalNotice() {
  return (
    <p className={styles.legalAmplio} role="note">
      {LEGAL_AMPLIO}
    </p>
  );
}
