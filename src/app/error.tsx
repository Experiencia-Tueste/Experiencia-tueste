'use client';

import styles from './error.module.css';

/**
 * Error boundary de la ruta raíz (Next.js 16: prop estable `retry`).
 * El error llega por contrato de Next (tipado en las props) pero se
 * oculta intencionalmente: mensaje genérico y seguro, sin stack traces,
 * secretos ni detalles técnicos. Sin servicios de monitoreo ni console.
 */
export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <section className={styles.wrap} role="alert">
      <p className={styles.code} aria-hidden="true">
        ¡Ups!
      </p>
      <h1 className={styles.title}>Algo salió mal</h1>
      <p className={styles.lead}>Ocurrió un error inesperado. Inténtalo de nuevo.</p>
      <button type="button" className={styles.retry} onClick={() => retry()}>
        Reintentar
      </button>
    </section>
  );
}
