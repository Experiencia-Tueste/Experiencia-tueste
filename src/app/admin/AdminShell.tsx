import Link from 'next/link';
import type { ReactNode } from 'react';

import type { CurrentAdmin } from '@/lib/auth/authorization';

import { logout } from './actions';
import { getVisibleAdminNavigation } from './navigation';
import styles from './Admin.module.css';

type AdminShellProps = {
  admin: CurrentAdmin;
  currentPath: string;
  children: ReactNode;
};

/**
 * Shell compartido de todas las rutas protegidas del panel.
 *
 * La navegación se filtra por capacidades para orientar al usuario, pero
 * cada página vuelve a autorizarse en el servidor con requireCapability().
 */
export function AdminShell({ admin, currentPath, children }: AdminShellProps) {
  const navigation = getVisibleAdminNavigation(admin.capabilities);
  const groups = Array.from(new Set(navigation.map((item) => item.group)));

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Navegación del panel">
        <div className={styles.brandBlock}>
          <p className={styles.kicker}>TUESTE · INTERNO</p>
          <p className={styles.brandName}>Panel administrativo</p>
          <p className={styles.brandHint}>Operación del ecosistema</p>
        </div>

        <nav className={styles.navigation}>
          {groups.map((group) => (
            <div key={group} className={styles.navigationGroup}>
              <p className={styles.navigationLabel}>{group}</p>
              <ul className={styles.navigationList}>
                {navigation
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const active = item.href === currentPath;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={active ? styles.navigationLinkActive : styles.navigationLink}
                          aria-current={active ? 'page' : undefined}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userSummary}>
            <span className={styles.userEmail}>{admin.email}</span>
            <span className={styles.userRole}>Rol: {admin.role}</span>
          </div>
          <form action={logout}>
            <button type="submit" className={styles.buttonGhost}>
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <div className={styles.workspace}>{children}</div>
    </div>
  );
}
