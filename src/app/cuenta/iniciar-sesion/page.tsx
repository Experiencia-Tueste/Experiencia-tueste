import Link from 'next/link';
import CustomerAuthForm from '../CustomerAuthForm';
import { GoogleCustomerAuth } from '../GoogleCustomerAuth';
import { loginCustomerAction } from '../actions';
import styles from '../customer-auth.module.css';

export const metadata = { title: 'Iniciar sesión · Tueste' };

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ oauth?: string }>;
}) {
  const { oauth } = await searchParams;
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link className={styles.back} href="/">
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
        <GoogleCustomerAuth fallback="login" />
        <CustomerAuthForm mode="login" action={loginCustomerAction} />
        <p className={styles.switch}>
          ¿Aún no tienes cuenta? <Link href="/cuenta/registro">Regístrate</Link>
        </p>
      </section>
    </main>
  );
}
