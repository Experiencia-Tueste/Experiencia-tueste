import { getAdminRepository } from '@/db/admin-identity-repository';
import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import styles from '../usuarios/page.module.css';

export const dynamic = 'force-dynamic';

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string;
    actor?: string;
    targetType?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const admin = await requireCapability('audit.read');
  const filters = await searchParams;
  const repository = getAdminRepository();
  if (!repository.listAudit) throw new Error('Repositorio de auditoría incompleto.');
  const logs = await repository.listAudit({
    action: filters.action?.trim() || undefined,
    actor: filters.actor?.trim() || undefined,
    targetType: filters.targetType?.trim() || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    limit: 100,
  });
  return (
    <AdminShell admin={admin} currentPath="/admin/auditoria">
      <main className="admin-module-main">
        <header className="admin-module-header">
          <p className="admin-module-eyebrow">TUESTE · TRAZABILIDAD</p>
          <h1>Auditoría</h1>
          <p>
            Registro inmutable de acciones administrativas. Los eventos no se editan ni se eliminan
            desde el panel.
          </p>
        </header>
        <section className="admin-module-section">
          <form method="get" className={styles.form}>
            <div className={styles.grid}>
              <label className={styles.label}>
                Acción
                <input
                  className={styles.input}
                  name="action"
                  defaultValue={filters.action ?? ''}
                  placeholder="Ej. content.published"
                />
              </label>
              <label className={styles.label}>
                Actor
                <input
                  className={styles.input}
                  name="actor"
                  type="email"
                  defaultValue={filters.actor ?? ''}
                  placeholder="correo@tueste.co"
                />
              </label>
              <label className={styles.label}>
                Tipo de objetivo
                <input
                  className={styles.input}
                  name="targetType"
                  defaultValue={filters.targetType ?? ''}
                  placeholder="vendor"
                />
              </label>
              <label className={styles.label}>
                Desde
                <input
                  className={styles.input}
                  name="from"
                  type="date"
                  defaultValue={filters.from ?? ''}
                />
              </label>
              <label className={styles.label}>
                Hasta
                <input
                  className={styles.input}
                  name="to"
                  type="date"
                  defaultValue={filters.to ?? ''}
                />
              </label>
            </div>
            <button className={styles.button} type="submit">
              Filtrar
            </button>
          </form>
        </section>
        <section className="admin-module-section">
          <h2>Eventos ({logs.length})</h2>
          {logs.length === 0 ? (
            <p>No hay eventos que coincidan.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Acción</th>
                  <th>Actor</th>
                  <th>Objetivo</th>
                  <th>Razón</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.occurredAt).toLocaleString('es-CO')}</td>
                    <td>{log.action}</td>
                    <td>{log.actorEmail ?? log.actorUserId}</td>
                    <td>
                      {log.targetType}
                      <br />
                      <span className={styles.small}>{log.targetId}</span>
                    </td>
                    <td>{log.reason}</td>
                    <td>
                      <details>
                        <summary>Ver</summary>
                        <pre className={styles.small}>{JSON.stringify(log.metadata, null, 2)}</pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </AdminShell>
  );
}
