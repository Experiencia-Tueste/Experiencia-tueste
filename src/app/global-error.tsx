'use client';

import styles from './global-error.module.css';

/**
 * Error boundary global (Next.js 16): cubre errores del root layout,
 * que `error.tsx` no envuelve. Debe incluir `<html>` y `<body>` propios
 * y no depender del layout (que podría haber fallado), de datos ni de
 * fuentes externas. El error llega por contrato de Next (tipado en las
 * props) pero se oculta intencionalmente: contenido mínimo y seguro,
 * sin monitoreo.
 */
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="es">
      <body className={styles.body}>
        <main className={styles.wrap}>
          <h1 className={styles.title}>Algo salió mal</h1>
          <p className={styles.lead}>Ocurrió un error inesperado. Inténtalo de nuevo.</p>
          <button type="button" className={styles.retry} onClick={() => retry()}>
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
