import Link from 'next/link';
import CustomerAuthForm from '../CustomerAuthForm';
import { loginCustomerAction } from '../actions';
import styles from '../customer-auth.module.css';

export const metadata = { title: 'Iniciar sesión · Tueste' };

export default function CustomerLoginPage() {
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
        <CustomerAuthForm mode="login" action={loginCustomerAction} />
        <p className={styles.switch}>
          ¿Aún no tienes cuenta? <Link href="/cuenta/registro">Regístrate</Link>
        </p>
      </section>
    </main>
  );
}
