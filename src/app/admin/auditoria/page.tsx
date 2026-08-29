import { getAdminRepository } from '@/db/admin-identity-repository';
import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import styles from '../usuarios/page.module.css';

export const dynamic = 'force-dynamic';

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const admin = await requireCapability('audit.read');
  const { action } = await searchParams;
  const repository = getAdminRepository();
  if (!repository.listAudit) throw new Error('Repositorio de auditoría incompleto.');
  const logs = await repository.listAudit({ action: action?.trim() || undefined, limit: 100 });
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
            <label className={styles.label}>
              Filtrar acción
              <input
                className={styles.input}
                name="action"
                defaultValue={action ?? ''}
                placeholder="Ej. content.published"
              />
            </label>
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
