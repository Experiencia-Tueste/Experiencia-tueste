'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  customerIdentityFromUser,
  type CustomerIdentity,
} from '@/features/customer-auth/customer-identity';
import { supabase } from '@/lib/supabase/client';
import styles from './PortalAuthNav.module.css';

/**
 * Navegación de identidad de clientes. Solo decide presentación; la
 * autorización real de /cuenta se valida nuevamente en el servidor.
 */
export default function PortalAuthNav({
  authenticatedOnly = false,
}: {
  authenticatedOnly?: boolean;
}) {
  const [identity, setIdentity] = useState<CustomerIdentity | null>(null);
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) {
        setIdentity(customerIdentityFromUser(data.user));
        setReady(true);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIdentity(customerIdentityFromUser(session?.user ?? null));
      setReady(true);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (!ready) return null;

  if (identity) {
    return (
      <nav className={styles.nav} aria-label="Cuenta">
        <Link
          className={styles.customerBadge}
          href="/cuenta"
          aria-label={`${identity.name}, Cliente Tueste. Ir a Mi cuenta`}
        >
          <span className={styles.avatar} aria-hidden="true">
            {identity.initial}
          </span>
          <span className={styles.identityCopy}>
            <strong className={styles.customerName}>{identity.name}</strong>
            <span className={styles.customerStatus}>Cliente Tueste · Cuenta activa</span>
          </span>
        </Link>
      </nav>
    );
  }

  if (authenticatedOnly) return null;

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
