import Link from 'next/link';
import Sun from '@/components/brand/Sun';
import ThemeToggle from '@/components/home/ThemeToggle';
import PortalAuthNav from './PortalAuthNav';
import styles from './PortalHeader.module.css';

/**
 * Encabezado del portal público. La identidad de clientes vive en
 * Supabase Auth y permanece separada del OAuth interno del administrador.
 */
export default function PortalHeader() {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="Tueste, ir al inicio">
        <Sun size={34} decorative={false} />
        <span className={styles.wordmark}>Tueste</span>
      </Link>
      <div className={styles.actions}>
        <PortalAuthNav />
        <ThemeToggle />
      </div>
    </header>
  );
}
