'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import styles from './PortalAuthNav.module.css';

/**
 * Navegación de identidad de clientes. Solo decide presentación; la
 * autorización real de /cuenta se valida nuevamente en el servidor.
 */
export default function PortalAuthNav() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setAuthenticated(Boolean(data.user));
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(Boolean(session?.user));
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (authenticated) {
    return (
      <nav className={styles.nav} aria-label="Cuenta">
        <Link className={styles.primary} href="/cuenta">
          Mi cuenta
        </Link>
      </nav>
    );
  }

  return (
    <nav className={styles.nav} aria-label="Acceso de clientes">
      <Link className={styles.secondary} href="/cuenta/iniciar-sesion">
        Iniciar sesión
      </Link>
      <Link className={styles.primary} href="/cuenta/registro">
        Registrarse
      </Link>
    </nav>
  );
}
