import { loginWithGoogle } from '../actions';
import { loadAdminConfig } from '@/lib/config/admin-auth-env';
import styles from '../Admin.module.css';

// El estado de configuración de Google se resuelve en runtime del
// servidor: nunca congelar esta ruta con el estado visto durante el
// build (los secretos se inyectan en runtime).
export const dynamic = 'force-dynamic';

/**
 * /admin/login — acceso restringido del panel interno.
 *
 * Si Google no está configurado, muestra el estado editorial «Acceso
 * interno en configuración» sin botón activo y sin detalles técnicos.
 * La autorización final la decide el RBAC persistente (usuario activo
 * con rol en PostgreSQL). Nunca expone secretos.
 */
export default function AdminLoginPage() {
  const config = loadAdminConfig();
  // La disponibilidad del botón depende SOLO de que Google OAuth esté
  // configurado; la autorización final la decide el RBAC persistente.
  const disponible = config.googleConfigured;

  return (
    <main className={styles.center}>
      <div className={styles.card}>
        <p className={styles.kicker}>TUESTE · INTERNO</p>
        <h1 className={styles.title}>Panel interno Tueste</h1>
        <p className={styles.text}>
          Acceso restringido para el equipo. Solo los correos autorizados pueden entrar.
        </p>

        {disponible ? (
          <form action={loginWithGoogle}>
            <button type="submit" className={styles.button}>
              Continuar con Google
            </button>
          </form>
        ) : (
          <p className={styles.soon} role="status">
            Acceso interno en configuración
          </p>
        )}
      </div>
    </main>
  );
}
