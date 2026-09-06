import Link from 'next/link';
import CustomerAuthForm from '../CustomerAuthForm';
import { GoogleCustomerAuth } from '../GoogleCustomerAuth';
import { registerCustomerAction } from '../actions';
import { safePostSignInPath } from '@/features/customer-auth/post-sign-in';
import styles from '../customer-auth.module.css';

export const metadata = { title: 'Crear cuenta · Tueste' };

export default async function CustomerRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ oauth?: string; next?: string }>;
}) {
  const { oauth, next: requestedPath } = await searchParams;
  const nextPath = safePostSignInPath(requestedPath) ?? undefined;
  const accountQuery = nextPath ? `?next=${encodeURIComponent(nextPath)}` : '';
  const backHref = nextPath?.startsWith('/tueste-tree') ? '/tueste-tree' : '/';
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link className={styles.back} href={backHref}>
          ← Volver a Tueste
        </Link>
        <p className={styles.kicker}>Tueste · Comunidad</p>
        <h1 className={styles.title}>Crear cuenta</h1>
        <p className={styles.intro}>
          Tu cuenta será el punto de entrada a membresías, compras y experiencias Tueste.
        </p>
        {oauth ? (
          <p className={styles.error} role="alert">
            No pudimos continuar con Google. Inténtalo de nuevo en unos minutos.
          </p>
        ) : null}
        <GoogleCustomerAuth fallback="registro" nextPath={nextPath} />
        <CustomerAuthForm mode="register" action={registerCustomerAction} nextPath={nextPath} />
        <p className={styles.switch}>
          ¿Ya tienes cuenta?{' '}
          <Link href={`/cuenta/iniciar-sesion${accountQuery}`}>Inicia sesión</Link>
        </p>
      </section>
    </main>
  );
}
