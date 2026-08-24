import { requireAdmin } from '@/lib/auth/authorization';
import { logout } from './actions';
import styles from './Admin.module.css';

// La sesión y la configuración se resuelven en runtime del servidor:
// nunca prerenderizar esta ruta con un redirect compilado en build.
export const dynamic = 'force-dynamic';

/**
 * /admin — dashboard mínimo protegido de la fundación segura.
 *
 * `requireAdmin()` protege la página en el servidor: sin sesión válida
 * redirige a /admin/login. Muestra solo la identidad permitida y el
 * estado de la fundación; sin métricas demo ni módulos operativos.
 */
export default async function AdminPage() {
  const admin = await requireAdmin();

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <p className={styles.kicker}>TUESTE · INTERNO</p>
        <h1 className={styles.title}>Panel administrativo</h1>
      </header>

      <section className={styles.status} aria-labelledby="fundacion-titulo">
        <h2 id="fundacion-titulo" className={styles.statusTitle}>
          Fundación segura activa
        </h2>
        <dl className={styles.identity}>
          <div>
            <dt>Correo autorizado</dt>
            <dd>{admin.email}</dd>
          </div>
          <div>
            <dt>Nombre</dt>
            <dd>{admin.name ?? '—'}</dd>
          </div>
          <div>
            <dt>Rol temporal</dt>
            <dd>admin</dd>
          </div>
        </dl>
      </section>

      <form action={logout}>
        <button type="submit" className={styles.buttonGhost}>
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
