import type { ReactNode } from 'react';
import styles from './Admin.module.css';

/**
 * Layout del panel administrativo: shell visual mínimo (sin
 * autenticación aquí). Cada página del panel protege su propio acceso
 * en el servidor; login y acceso denegado son públicas por diseño.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className={styles.page}>{children}</div>;
}
