import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { logoutCustomerAction } from './actions';
import styles from './customer-auth.module.css';

export const metadata = { title: 'Mi cuenta · Tueste' };
export const dynamic = 'force-dynamic';

export default async function CustomerAccountPage() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/cuenta/iniciar-sesion');

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect('/cuenta/iniciar-sesion');

  const email = typeof data.claims.email === 'string' ? data.claims.email : 'Cuenta Tueste';

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link className={styles.back} href="/">
          ← Volver a Tueste
        </Link>
        <p className={styles.kicker}>Tueste · Cuenta</p>
        <h1 className={styles.title}>Mi cuenta</h1>
        <p className={styles.intro}>
          Esta es la base de tu identidad Tueste. Aquí conectaremos membresías, compras y
          beneficios.
        </p>

        <div className={styles.accountGrid}>
          <div className={styles.accountItem}>
            <p className={styles.accountLabel}>Correo</p>
            <p className={styles.accountValue}>{email}</p>
          </div>
          <div className={styles.accountItem}>
            <p className={styles.accountLabel}>Estado</p>
            <p className={styles.accountValue}>Cuenta activa</p>
          </div>
        </div>

        <Link className={styles.experienceCta} href="/experiencia">
          Volver a Experiencia Tueste →
        </Link>

        <form action={logoutCustomerAction}>
          <button className={styles.logout} type="submit">
            Cerrar sesión
          </button>
        </form>
      </section>
    </main>
  );
}
