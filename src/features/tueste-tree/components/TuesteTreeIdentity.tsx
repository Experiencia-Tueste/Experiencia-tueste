'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  customerIdentityFromUser,
  type CustomerIdentity,
} from '@/features/customer-auth/customer-identity';
import { supabase } from '@/lib/supabase/client';
import styles from '../tueste-tree.module.css';

export interface TuesteTreeIdentityProps {
  returnTo: '/tueste-tree' | '/tueste-tree/adoptar';
}

/** Presenta la identidad de la sesión Supabase compartida con el resto de Tueste. */
export default function TuesteTreeIdentity({ returnTo }: TuesteTreeIdentityProps) {
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

  if (!ready) {
    return (
      <span className={styles.treeIdentity} aria-label="Comprobando sesión Tueste">
        Cuenta
      </span>
    );
  }

  if (!identity) {
    return (
      <Link
        className={styles.treeIdentity}
        href={`/cuenta/iniciar-sesion?next=${encodeURIComponent(returnTo)}`}
      >
        Iniciar sesión
      </Link>
    );
  }

  return (
    <Link
      className={styles.treeIdentity}
      href="/cuenta"
      aria-label={`${identity.name}, Cliente Tueste. Ir a Mi cuenta`}
    >
      <span className={styles.treeIdentityAvatar} aria-hidden="true">
        {identity.initial}
      </span>
      <span className={styles.treeIdentityCopy}>
        <strong>{identity.name}</strong>
        <small>{identity.email}</small>
      </span>
    </Link>
  );
}
