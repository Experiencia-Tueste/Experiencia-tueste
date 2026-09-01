import Link from 'next/link';

import { getAdminDashboard } from '@/features/admin/dashboard-service';
import { requireAdmin } from '@/lib/auth/authorization';
import { AdminShell } from './AdminShell';
import styles from './Admin.module.css';

// La sesión y la configuración se resuelven en runtime del servidor:
// nunca prerenderizar esta ruta con un redirect compilado en build.
export const dynamic = 'force-dynamic';

/**
 * /admin — tablero protegido con indicadores persistidos.
 *
 * `requireAdmin()` protege la página en el servidor: sin sesión válida
 * redirige a /admin/login. Muestra solo la identidad permitida y el
 * estado real de los módulos que su rol puede consultar.
 */
export default async function AdminPage() {
  const admin = await requireAdmin();
  const dashboard = await getAdminDashboard(admin);

  return (
    <AdminShell admin={admin} currentPath="/admin">
      <main className={styles.main}>
        <header className={styles.contentHeader}>
          <p className={styles.kicker}>TUESTE · INTERNO</p>
          <h1 className={styles.title}>El ecosistema, hoy</h1>
          <p className={styles.text}>
            Una vista directa de la operación persistida. Cada indicador respeta los permisos de tu
            sesión y se calcula con información real del panel.
          </p>
        </header>

        <section className={`${styles.section} ${styles.sectionFeatured}`}>
          <header className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>SESIÓN PROTEGIDA</p>
              <h2 className={styles.statusTitle}>Fundación segura activa</h2>
              <p className={styles.sectionDescription}>
                Acceso resuelto con identidad y roles persistidos en servidor.
              </p>
            </div>
            <span className={styles.sessionBadge}>{admin.email}</span>
          </header>
          <dl className={styles.identity}>
            <div>
              <dt>Nombre</dt>
              <dd>{admin.name ?? '—'}</dd>
            </div>
            <div>
              <dt>Rol principal</dt>
              <dd>{admin.role}</dd>
            </div>
            <div>
              <dt>Capacidades</dt>
              <dd>{admin.capabilities.length}</dd>
            </div>
          </dl>
        </section>

        {dashboard.editorial ? (
          <section className={styles.section} aria-labelledby="editorial-titulo">
            <header className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>EDITORIAL</p>
                <h2 id="editorial-titulo" className={styles.statusTitle}>
                  Contenido y lanzamientos
                </h2>
                <p className={styles.sectionDescription}>
                  Estado de publicaciones, estrenos y biblioteca de activos.
                </p>
              </div>
              <Link className={styles.quickLink} href="/admin/contenido">
                Abrir editorial
              </Link>
            </header>
            <div className={styles.metricsGrid}>
              <Metric label="Piezas" value={dashboard.editorial.content} hint="Contenido total" />
              <Metric
                label="Lanzamientos"
                value={dashboard.editorial.releases}
                hint="Estrenos registrados"
              />
              <Metric
                label="Programadas"
                value={dashboard.editorial.scheduled}
                hint="Contenido y estrenos"
              />
              <Metric
                label="Activos pendientes"
                value={dashboard.editorial.pendingAssets}
                hint="Requieren aprobación"
              />
            </div>
          </section>
        ) : null}

        <div className={styles.dashboardColumns}>
          {dashboard.team ? (
            <section className={styles.section} aria-labelledby="equipo-titulo">
              <header className={styles.sectionHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>GOBIERNO</p>
                  <h2 id="equipo-titulo" className={styles.statusTitle}>
                    Equipo administrativo
                  </h2>
                </div>
                <Link className={styles.quickLink} href="/admin/usuarios">
                  Gestionar
                </Link>
              </header>
              <div className={styles.compactMetrics}>
                <Metric label="Activos" value={dashboard.team.active} hint="Con acceso" />
                <Metric label="Invitados" value={dashboard.team.invited} hint="Por activar" />
                <Metric label="Suspendidos" value={dashboard.team.suspended} hint="Sin acceso" />
              </div>
            </section>
          ) : null}

          {dashboard.configuration ? (
            <section className={styles.section} aria-labelledby="configuracion-titulo">
              <header className={styles.sectionHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>PLATAFORMA</p>
                  <h2 id="configuracion-titulo" className={styles.statusTitle}>
                    Configuración pública
                  </h2>
                </div>
                <Link className={styles.quickLink} href="/admin/configuracion">
                  Configurar
                </Link>
              </header>
              <div className={styles.configurationProgress}>
                <strong>
                  {dashboard.configuration.configured}/{dashboard.configuration.total}
                </strong>
                <span>campos definidos</span>
              </div>
              <progress
                className={styles.progress}
                max={dashboard.configuration.total}
                value={dashboard.configuration.configured}
              >
                {dashboard.configuration.configured} de {dashboard.configuration.total}
              </progress>
            </section>
          ) : null}
        </div>

        {dashboard.activity ? (
          <section className={styles.section} aria-labelledby="actividad-titulo">
            <header className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>TRAZABILIDAD</p>
                <h2 id="actividad-titulo" className={styles.statusTitle}>
                  Actividad reciente
                </h2>
                <p className={styles.sectionDescription}>Últimas acciones auditadas del panel.</p>
              </div>
              <Link className={styles.quickLink} href="/admin/auditoria">
                Ver auditoría
              </Link>
            </header>
            {dashboard.activity.length === 0 ? (
              <p className={styles.empty}>Aún no hay eventos de auditoría.</p>
            ) : (
              <ol className={styles.activityList}>
                {dashboard.activity.map((event) => (
                  <li className={styles.activityItem} key={event.id}>
                    <div>
                      <strong>{event.action}</strong>
                      <span>{event.reason}</span>
                    </div>
                    <time dateTime={event.occurredAt}>
                      {new Date(event.occurredAt).toLocaleString('es-CO')}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ) : null}
      </main>
    </AdminShell>
  );
}

function Metric({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <article className={styles.metricCard}>
      <span className={styles.metricLabel}>{label}</span>
      <strong className={styles.metricValue}>{value}</strong>
      <span className={styles.metricHint}>{hint}</span>
    </article>
  );
}
