import { getEngagementRequests } from '@/features/engagements/service';
import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import { changeEngagementStatusAction } from './actions';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

/** Bandeja privada de solicitudes enviadas desde Tueste Experiencia. */
export default async function ContactosPage() {
  const admin = await requireCapability('crm.read');
  const requests = await getEngagementRequests();
  const canManage = admin.capabilities.includes('crm.manage');

  return (
    <AdminShell admin={admin} currentPath="/admin/contactos">
      <main className="admin-module-main">
        <header className="admin-module-header">
          <p className="admin-module-eyebrow">TUESTE · SOLICITUDES</p>
          <h1>Solicitudes del sitio</h1>
          <p>
            Intereses recibidos desde Tueste Experiencia. Aquí se revisan antes de confirmar cupos,
            activaciones B2B o publicaciones.
          </p>
        </header>

        <section className="admin-module-section">
          <div className={styles.summary}>
            <strong>{requests.length}</strong>
            <span>solicitudes registradas</span>
          </div>
          {requests.length === 0 ? (
            <p className={styles.empty}>Aún no hay solicitudes enviadas desde el sitio.</p>
          ) : (
            <div className={styles.list}>
              {requests.map((request) => (
                <article className={styles.card} key={request.id}>
                  <header>
                    <div>
                      <span className={styles.type}>{labelFor(request.type)}</span>
                      <h2>{request.requesterName}</h2>
                      <p>{request.requesterEmail}</p>
                    </div>
                    <span className={styles.status}>{request.status}</span>
                  </header>
                  <dl>
                    <div>
                      <dt>Referencia</dt>
                      <dd>{request.reference}</dd>
                    </div>
                    <div>
                      <dt>Recibida</dt>
                      <dd>
                        <time dateTime={request.createdAt}>
                          {new Date(request.createdAt).toLocaleString('es-CO')}
                        </time>
                      </dd>
                    </div>
                  </dl>
                  {request.details ? <p className={styles.details}>{request.details}</p> : null}
                  {canManage ? (
                    <form action={changeEngagementStatusAction} className={styles.form}>
                      <input type="hidden" name="id" value={request.id} />
                      <input type="hidden" name="from" value={request.status} />
                      <label>
                        Estado
                        <select name="to" defaultValue={request.status}>
                          <option value="pending">Pendiente</option>
                          <option value="contacted">Contactada</option>
                          <option value="closed">Cerrada</option>
                        </select>
                      </label>
                      <label>
                        Razón
                        <input name="reason" required minLength={3} maxLength={300} />
                      </label>
                      <button type="submit">Actualizar</button>
                    </form>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </AdminShell>
  );
}

function labelFor(type: string) {
  const labels: Record<string, string> = {
    community: 'Comunidad',
    event: 'Evento',
    radio: 'Radio Origen',
    market: 'Mercado de Origen',
  };
  return labels[type] ?? type;
}
