import Link from 'next/link';
import CustomerAuthForm from '../CustomerAuthForm';
import { registerCustomerAction } from '../actions';
import styles from '../customer-auth.module.css';

export const metadata = { title: 'Crear cuenta · Tueste' };

export default function CustomerRegisterPage() {
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
        <CustomerAuthForm mode="register" action={registerCustomerAction} />
        <p className={styles.switch}>
          ¿Ya tienes cuenta? <Link href="/cuenta/iniciar-sesion">Inicia sesión</Link>
        </p>
      </section>
    </main>
  );
}
