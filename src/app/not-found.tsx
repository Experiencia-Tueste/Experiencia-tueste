import Link from 'next/link';
import styles from './not-found.module.css';

/**
 * Página 404 global (rutas inexistentes). Se renderiza dentro del root
 * layout, por lo que hereda tokens y tema. Sin datos de negocio ni
 * enlaces externos: solo semántica clara y retorno al inicio.
 */
export default function NotFound() {
  return (
    <section className={styles.wrap}>
      <p className={styles.code} aria-hidden="true">
        404
      </p>
      <h1 className={styles.title}>Página no encontrada</h1>
      <p className={styles.lead}>La ruta que buscas no existe o fue movida.</p>
      <Link href="/" className={styles.home}>
        Volver al inicio
      </Link>
    </section>
  );
}
