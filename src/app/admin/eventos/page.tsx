import { getEventWorkspace } from '@/features/admin/event-service';
import { canTransitionEvent, EVENT_FILTER_SCHEMA } from '@/features/admin/event-schemas';
import type { AdminEventStatus } from '@/features/admin/event-schemas';
import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import {
  checkInAction,
  confirmEventRequestAction,
  createEventAction,
  registerAttendeeAction,
  transitionEventAction,
} from './actions';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; city?: string; from?: string; to?: string }>;
}) {
  const admin = await requireCapability('events.read');
  const params = await searchParams;
  const filters = EVENT_FILTER_SCHEMA.parse(params);
  const events = await getEventWorkspace(admin, filters);
  const canManage = admin.capabilities.includes('events.manage');
  const canCheckIn = admin.capabilities.includes('events.checkin');
  const canExport = admin.capabilities.includes('events.export');
  const canAudit = admin.capabilities.includes('audit.read');
  const exportQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) exportQuery.set(key, value);
  }
  return (
    <AdminShell admin={admin} currentPath="/admin/eventos">
      <main className="admin-module-main">
        <header className="admin-module-header">
          <p className="admin-module-eyebrow">TUESTE · EVENTOS</p>
          <h1>Boletería y eventos</h1>
          <p>Agenda, cupos, lista de espera, tickets únicos y control de ingreso.</p>
        </header>

        <section className="admin-module-section">
          <form method="get" className={styles.form}>
            <div className={styles.grid}>
              <label className={styles.label}>
                Estado
                <select className={styles.select} name="status" defaultValue={filters.status ?? ''}>
                  <option value="">Todos</option>
                  {['draft', 'open', 'waitlist', 'closed', 'cancelled'].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <Field label="Ciudad" name="city" defaultValue={filters.city ?? ''} />
              <Field label="Desde" name="from" type="date" defaultValue={filters.from ?? ''} />
              <Field label="Hasta" name="to" type="date" defaultValue={filters.to ?? ''} />
            </div>
            <button className={styles.button} type="submit">
              Filtrar eventos
            </button>
            {canExport ? (
              <a className={styles.buttonGhost} href={`/admin/eventos/export?${exportQuery}`}>
                Exportar asistentes CSV
              </a>
            ) : null}
            {canAudit ? (
              <a className={styles.buttonGhost} href="/admin/auditoria?action=event.">
                Ver historial
              </a>
            ) : null}
          </form>
        </section>

        {canManage ? (
          <section className="admin-module-section">
            <h2>Crear evento</h2>
            <form action={createEventAction} className={styles.form}>
              <div className={styles.grid}>
                <Field label="Nombre" name="title" required />
                <Field label="Slug" name="slug" required />
                <Field label="Inicio" name="startsAt" type="datetime-local" required />
                <Field label="Final opcional" name="endsAt" type="datetime-local" />
                <Field label="Ciudad" name="city" required />
                <Field label="Lugar" name="venue" required />
                <Field label="Capacidad opcional" name="capacity" type="number" min="1" />
                <Field label="Razón" name="reason" required minLength={3} />
              </div>
              <button className={styles.button} type="submit">
                Crear borrador
              </button>
            </form>
          </section>
        ) : null}

        <section className="admin-module-section">
          <h2>Eventos ({events.length})</h2>
          {events.length === 0 ? (
            <p className={styles.empty}>Aún no hay eventos persistidos.</p>
          ) : (
            <div className={styles.eventGrid}>
              {events.map((event) => (
                <article className={styles.eventCard} key={event.id}>
                  <header className={styles.eventHeader}>
                    <div>
                      <h2>{event.title}</h2>
                      <p className={styles.meta}>
                        {new Date(event.startsAt).toLocaleString('es-CO')} · {event.city} ·{' '}
                        {event.venue}
                      </p>
                    </div>
                    <span className={styles.status}>{event.status}</span>
                  </header>
                  <div className={styles.stats}>
                    <div>
                      <strong>{event.reservedCount}</strong>
                      <span>Reservas</span>
                    </div>
                    <div>
                      <strong>{event.checkedInCount}</strong>
                      <span>Check-ins</span>
                    </div>
                    <div>
                      <strong>{event.capacity ?? '∞'}</strong>
                      <span>Capacidad</span>
                    </div>
                  </div>
                  {canManage ? <EventControls event={event} /> : null}
                  {event.requests.length > 0 ? (
                    <section className={styles.compactForm}>
                      <h3>Solicitudes públicas ({event.requests.length})</h3>
                      {event.requests.map((request) => (
                        <div className={styles.attendee} key={request.id}>
                          <div>
                            <strong>{request.requesterName}</strong>
                            <span className={styles.meta}>
                              {request.requesterEmail} · {request.attendeeCount} persona(s) ·{' '}
                              {request.status}
                            </span>
                          </div>
                          {canManage && request.status !== 'closed' ? (
                            <form action={confirmEventRequestAction} className={styles.inlineForm}>
                              <input name="requestId" type="hidden" value={request.id} />
                              <input
                                aria-label={`Razón para confirmar ${request.requesterName}`}
                                className={styles.input}
                                name="reason"
                                defaultValue="Solicitud confirmada por el equipo"
                                required
                                minLength={3}
                              />
                              <button className={styles.buttonGhost} type="submit">
                                Confirmar solicitud
                              </button>
                            </form>
                          ) : null}
                        </div>
                      ))}
                    </section>
                  ) : null}
                  {canManage && ['open', 'waitlist'].includes(event.status) ? (
                    <form action={registerAttendeeAction} className={styles.compactForm}>
                      <input name="eventId" type="hidden" value={event.id} />
                      <div className={styles.grid}>
                        <Field label="Asistente" name="name" required />
                        <Field label="Correo" name="email" type="email" required />
                      </div>
                      <Field label="Razón" name="reason" required minLength={3} />
                      <button className={styles.buttonGhost} type="submit">
                        Registrar asistente
                      </button>
                    </form>
                  ) : null}
                  {canCheckIn ? (
                    <form action={checkInAction} className={styles.compactForm}>
                      <input name="eventId" type="hidden" value={event.id} />
                      <Field label="Código de ticket / QR" name="ticketCode" required />
                      <Field
                        label="Razón"
                        name="reason"
                        defaultValue="Check-in en acceso"
                        required
                        minLength={3}
                      />
                      <button className={styles.buttonGhost} type="submit">
                        Confirmar check-in
                      </button>
                    </form>
                  ) : null}
                  <h3>Asistentes ({event.attendees.length})</h3>
                  {event.attendees.length === 0 ? (
                    <p className={styles.empty}>Sin asistentes registrados.</p>
                  ) : (
                    <ul className={styles.attendeeList}>
                      {event.attendees.map((attendee) => (
                        <li className={styles.attendee} key={attendee.id}>
                          <div>
                            <strong>{attendee.name}</strong>
                            <span className={styles.meta}>{attendee.email}</span>
                            <code className={styles.ticket}>{attendee.ticketCode}</code>
                          </div>
                          <span className={styles.status}>{attendee.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </AdminShell>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props;
  return (
    <label className={styles.label}>
      {label}
      <input className={styles.input} {...inputProps} />
    </label>
  );
}

const EVENT_STATES: AdminEventStatus[] = ['draft', 'open', 'waitlist', 'closed', 'cancelled'];

function EventControls({ event }: { event: { id: string; status: AdminEventStatus } }) {
  const nextStates = EVENT_STATES.filter((next) => canTransitionEvent(event.status, next));
  if (nextStates.length === 0) return null;
  return (
    <form action={transitionEventAction} className={styles.compactForm}>
      <input name="id" type="hidden" value={event.id} />
      <input name="from" type="hidden" value={event.status} />
      <label className={styles.label}>
        Nuevo estado
        <select className={styles.select} name="to" required>
          {nextStates.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </label>
      <Field label="Razón" name="reason" required minLength={3} />
      <button className={styles.buttonGhost} type="submit">
        Actualizar estado
      </button>
    </form>
  );
}
