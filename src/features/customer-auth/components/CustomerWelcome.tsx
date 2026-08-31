'use client';

import { useEffect, useState } from 'react';
import { customerIdentityFromUser, type CustomerIdentity } from '../customer-identity';
import { supabase } from '@/lib/supabase/client';
import styles from './CustomerWelcome.module.css';

export default function CustomerWelcome() {
  const [identity, setIdentity] = useState<CustomerIdentity | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('bienvenida') !== '1' || !supabase) return;

    let active = true;
    url.searchParams.delete('bienvenida');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);

    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const nextIdentity = customerIdentityFromUser(data.user);
      if (!nextIdentity) return;
      setIdentity(nextIdentity);
      setVisible(true);
    });

    const timeout = window.setTimeout(() => setVisible(false), 7000);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, []);

  if (!visible || !identity) return null;

  return (
    <aside className={styles.welcome} role="status" aria-live="polite">
      <span className={styles.avatar} aria-hidden="true">
        {identity.initial}
      </span>
      <span className={styles.copy}>
        <span className={styles.eyebrow}>Cuenta confirmada</span>
        <strong>Bienvenido, {identity.name}</strong>
        <span>Ya eres Cliente Tueste. Tu experiencia está lista.</span>
      </span>
      <button type="button" onClick={() => setVisible(false)} aria-label="Cerrar bienvenida">
        ×
      </button>
    </aside>
  );
}
