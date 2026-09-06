import Link from 'next/link';
import CustomerAuthForm from '../CustomerAuthForm';
import { GoogleCustomerAuth } from '../GoogleCustomerAuth';
import { loginCustomerAction } from '../actions';
import { safePostSignInPath } from '@/features/customer-auth/post-sign-in';
import styles from '../customer-auth.module.css';

export const metadata = { title: 'Iniciar sesión · Tueste' };

export default async function CustomerLoginPage({
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
        <h1 className={styles.title}>Iniciar sesión</h1>
        <p className={styles.intro}>
          Entra a tu cuenta para continuar con tus experiencias y beneficios.
        </p>
        {oauth ? (
          <p className={styles.error} role="alert">
            No pudimos iniciar con Google. Inténtalo de nuevo en unos minutos.
          </p>
        ) : null}
        <GoogleCustomerAuth fallback="login" nextPath={nextPath} />
        <CustomerAuthForm mode="login" action={loginCustomerAction} nextPath={nextPath} />
        <p className={styles.switch}>
          ¿Aún no tienes cuenta? <Link href={`/cuenta/registro${accountQuery}`}>Regístrate</Link>
        </p>
      </section>
    </main>
  );
}
