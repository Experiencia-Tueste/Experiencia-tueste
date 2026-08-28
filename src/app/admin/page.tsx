import { requireAdmin } from '@/lib/auth/authorization';
import { AdminShell } from './AdminShell';
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
    <AdminShell admin={admin} currentPath="/admin">
      <main className={styles.main}>
        <header className={styles.contentHeader}>
          <p className={styles.kicker}>TUESTE · INTERNO</p>
          <h1 className={styles.title}>El ecosistema, hoy</h1>
          <p className={styles.text}>
            Centro de operación del panel. Los indicadores aparecerán cuando cada módulo tenga
            persistencia y consultas reales.
          </p>
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
              <dt>Rol persistido</dt>
              <dd>{admin.role}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.status} aria-labelledby="siguiente-titulo">
          <h2 id="siguiente-titulo" className={styles.statusTitle}>
            Próxima capa
          </h2>
          <p className={styles.text}>
            La navegación ya refleja tus permisos. Cada sección se implementará como una rebanada
            vertical: esquema, servicio, autorización, auditoría, pruebas e interfaz.
          </p>
        </section>
      </main>
    </AdminShell>
  );
}
