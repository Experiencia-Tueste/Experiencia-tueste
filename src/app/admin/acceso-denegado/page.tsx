import { logout } from '../actions';
import styles from '../Admin.module.css';

/**
 * /admin/acceso-denegado — mensaje corto y seguro cuando la sesión no
 * tiene un correo permitido o falta una capacidad. Nunca muestra la
 * allowlist ni detalles técnicos; ofrece cerrar sesión.
 */
export default function AdminDeniedPage() {
  return (
    <main className={styles.center}>
      <div className={styles.card}>
        <p className={styles.kicker}>TUESTE · INTERNO</p>
        <h1 className={styles.title}>Acceso denegado</h1>
        <p className={styles.text}>
          Tu sesión no tiene permisos para esta sección del panel. Si crees que es un error,
          contacta con el equipo.
        </p>
        <form action={logout}>
          <button type="submit" className={styles.buttonGhost}>
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}
