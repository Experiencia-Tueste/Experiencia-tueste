import type { ReactNode } from 'react';
import SkipLink from '@/components/SkipLink';
import TuesteTreeFooter from './TuesteTreeFooter';
import TuesteTreeSidebar from './TuesteTreeSidebar';
import TuesteTreeTopbar from './TuesteTreeTopbar';
import styles from '../tueste-tree.module.css';

export interface TuesteTreePageShellProps {
  /** Ruta activa de la sidebar. */
  active: 'dashboard' | 'adoptar';
  /** El dashboard usa rail lateral; el ritual de adopción, barra superior. */
  variant?: 'dashboard' | 'adoption';
  /** Contenido principal de la página. */
  children: ReactNode;
}

/**
 * Envoltorio de página de Tueste Tree: sidebar de aplicación en
 * escritorio (cabecera compacta en móvil), SkipLink, contenido principal
 * y pie legal. SSR determinista.
 */
export default function TuesteTreePageShell({
  active,
  children,
  variant = 'dashboard',
}: TuesteTreePageShellProps) {
  if (variant === 'adoption') {
    return (
      <div className={styles.page}>
        <SkipLink />
        <TuesteTreeTopbar />
        <main id="contenido" tabIndex={-1} className={styles.adoptMain}>
          {children}
        </main>
        <TuesteTreeFooter />
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <SkipLink />
      <TuesteTreeSidebar active={active} />
      <div className={styles.shellContent}>
        <main id="contenido" tabIndex={-1} className={styles.shellMain}>
          {children}
        </main>
        <TuesteTreeFooter />
      </div>
    </div>
  );
}
