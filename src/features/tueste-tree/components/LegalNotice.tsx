import { LEGAL_AMPLIO } from '../data/content';
import styles from '../tueste-tree.module.css';

/**
 * Aviso legal visible, sobrio y estático: sin oferta pública, sin
 * inversión ejecutable, sin promesa contractual. Se muestra al final
 * de ambas rutas de Tueste Tree.
 */
export default function LegalNotice() {
  return (
    <p className={styles.legalAmplio} role="note">
      {LEGAL_AMPLIO}
    </p>
  );
}
