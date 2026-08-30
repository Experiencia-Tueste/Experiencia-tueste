import type { ReactNode } from 'react';
import styles from './Admin.module.css';

// Todas las rutas bajo /admin consultan la sesión y el RBAC en el servidor.
// Evita que Next reutilice una respuesta de autorización entre navegaciones.
export const dynamic = 'force-dynamic';

/**
 * Layout del panel administrativo: shell visual mínimo (sin
 * autenticación aquí). Cada página del panel protege su propio acceso
 * en el servidor; login y acceso denegado son públicas por diseño.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className={styles.page}>{children}</div>;
}
