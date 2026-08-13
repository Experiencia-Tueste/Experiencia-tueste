import Sun from '@/components/brand/Sun';
import ThemeToggle from '@/components/home/ThemeToggle';
import styles from './PortalHeader.module.css';

/**
 * Encabezado mínimo del portal: logo de Tueste a la izquierda y
 * ThemeToggle a la derecha. Sin carrito ni menú de la experiencia.
 * El logo no es un enlace (el portal no tiene navegación interna).
 */
export default function PortalHeader() {
  return (
    <header className={styles.header}>
      <span className={styles.brand}>
        <Sun size={34} decorative={false} />
        <span className={styles.wordmark}>Tueste</span>
      </span>
      <ThemeToggle />
    </header>
  );
}
