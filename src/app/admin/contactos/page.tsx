import { getEngagementRequests } from '@/features/engagements/service';
import type { EngagementPayload } from '@/features/engagements';
import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import {
  activateRadioOpportunityAction,
  changeEngagementStatusAction,
  changeMarketApplicationStageAction,
  changeRadioOpportunityStageAction,
} from './actions';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

/** Bandeja privada de solicitudes enviadas desde Tueste Experiencia. */
export default async function ContactosPage() {
  const admin = await requireCapability('crm.read');
  const requests = await getEngagementRequests(admin);
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
                  <PayloadDetails payload={request.payload} />
                  {request.type === 'radio' && request.radioStage ? (
                    <p className={styles.pipeline}>
                      Pipeline Radio: <strong>{radioStageLabel(request.radioStage)}</strong>
                    </p>
                  ) : null}
                  {request.type === 'market' && request.marketStage ? (
                    <p className={styles.pipeline}>
                      Revisión de vendedor: <strong>{marketStageLabel(request.marketStage)}</strong>
                    </p>
                  ) : null}
                  {request.type === 'market' &&
                  request.marketStage === 'approved' &&
                  request.marketVendorId ? (
                    <p className={styles.pipeline}>
                      Vendedor vinculado. La membresía quedó creada sin activar cobro.
                    </p>
                  ) : null}
                  {canManage ? (
                    <>
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
                      {request.type === 'radio' && request.radioStage ? (
                        <form action={changeRadioOpportunityStageAction} className={styles.form}>
                          <input type="hidden" name="id" value={request.id} />
                          <input type="hidden" name="from" value={request.radioStage} />
                          <label>
                            Pipeline Radio
                            <select name="to" defaultValue={request.radioStage}>
                              <option value="new">Nueva</option>
                              <option value="qualified">Calificada</option>
                              <option value="proposal">Propuesta</option>
                              <option value="won">Ganada</option>
                              <option value="lost">Perdida</option>
                            </select>
                          </label>
                          <label>
                            Razón
                            <input name="reason" required minLength={3} maxLength={300} />
                          </label>
                          <button type="submit">Actualizar pipeline</button>
                        </form>
                      ) : null}
                      {request.type === 'radio' && request.radioStage === 'won' ? (
                        request.radioCompanyId && request.radioChannelId ? (
                          <p className={styles.pipeline}>
                            Activación operativa vinculada. El canal queda pendiente de
                            confirmación, sin cobro automático.
                          </p>
                        ) : (
                          <form action={activateRadioOpportunityAction} className={styles.form}>
                            <input type="hidden" name="id" value={request.id} />
                            <label>
                              Razón de activación
                              <input name="reason" required minLength={3} maxLength={300} />
                            </label>
                            <button type="submit">Crear canal operativo</button>
                          </form>
                        )
                      ) : null}
                      {request.type === 'market' && request.marketStage ? (
                        <form action={changeMarketApplicationStageAction} className={styles.form}>
                          <input type="hidden" name="id" value={request.id} />
                          <input type="hidden" name="from" value={request.marketStage} />
                          <label>
                            Revisión de vendedor
                            <select name="to" defaultValue={request.marketStage}>
                              <option value="submitted">Enviada</option>
                              <option value="review">En revisión</option>
                              <option value="approved">Aprobada</option>
                              <option value="rejected">Rechazada</option>
                            </select>
                          </label>
                          <label>
                            Razón
                            <input name="reason" required minLength={3} maxLength={300} />
                          </label>
                          <button type="submit">Actualizar revisión</button>
                        </form>
                      ) : null}
                    </>
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

function PayloadDetails({ payload }: { payload: EngagementPayload }) {
  const entries = Object.entries(payload).filter(
    ([key, value]) => key !== 'schemaVersion' && value !== null,
  );
  if (entries.length === 0) return null;
  return (
    <dl className={styles.payload} aria-label="Datos estructurados de la solicitud">
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt>{payloadLabel(key)}</dt>
          <dd>{Array.isArray(value) ? value.join(', ') : String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function payloadLabel(key: string) {
  const labels: Record<string, string> = {
    attendeeCount: 'Asistentes',
    businessType: 'Tipo de negocio',
    category: 'Categoría',
    city: 'Ciudad',
    company: 'Empresa',
    consent: 'Consentimiento',
    eventTitle: 'Evento',
    hours: 'Horario',
    itemSlug: 'Producto',
    locations: 'Sedes',
    planName: 'Plan',
    priceCop: 'Precio declarado',
    priceUsd: 'Precio de referencia',
    preferences: 'Preferencias',
    region: 'Región',
    responsible: 'Responsable',
    salesChannels: 'Canales de venta',
    brand: 'Marca',
    origin: 'Origen',
  };
  return labels[key] ?? key;
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

function radioStageLabel(stage: string) {
  const labels: Record<string, string> = {
    new: 'Nueva',
    qualified: 'Calificada',
    proposal: 'Propuesta',
    won: 'Ganada',
    lost: 'Perdida',
  };
  return labels[stage] ?? stage;
}

function marketStageLabel(stage: string) {
  const labels: Record<string, string> = {
    submitted: 'Enviada',
    review: 'En revisión',
    approved: 'Aprobada',
    rejected: 'Rechazada',
  };
  return labels[stage] ?? stage;
}
