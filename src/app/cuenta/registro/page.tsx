import Link from 'next/link';
import CustomerAuthForm from '../CustomerAuthForm';
import { GoogleCustomerAuth } from '../GoogleCustomerAuth';
import { registerCustomerAction } from '../actions';
import styles from '../customer-auth.module.css';

export const metadata = { title: 'Crear cuenta · Tueste' };

export default async function CustomerRegisterPage({
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
        <h1 className={styles.title}>Crear cuenta</h1>
        <p className={styles.intro}>
          Tu cuenta será el punto de entrada a membresías, compras y experiencias Tueste.
        </p>
        {oauth ? (
          <p className={styles.error} role="alert">
            No pudimos continuar con Google. Inténtalo de nuevo en unos minutos.
          </p>
        ) : null}
        <GoogleCustomerAuth fallback="registro" />
        <CustomerAuthForm mode="register" action={registerCustomerAction} />
        <p className={styles.switch}>
          ¿Ya tienes cuenta? <Link href="/cuenta/iniciar-sesion">Inicia sesión</Link>
        </p>
      </section>
    </main>
  );
}
