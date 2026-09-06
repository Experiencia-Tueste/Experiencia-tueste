import LegalNotice from './LegalNotice';
import styles from '../tueste-tree.module.css';

/**
 * Pie mínimo compartido de Tueste Tree: nota legal amplia y visible
 * (Monacua Global Company S.A.S., contenido informativo y demostrativo).
 */
export default function TuesteTreeFooter() {
  return (
    <footer className={styles.footer}>
      <LegalNotice />
    </footer>
  );
}
