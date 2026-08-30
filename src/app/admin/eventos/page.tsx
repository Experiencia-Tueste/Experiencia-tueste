import { getEventWorkspace } from '@/features/admin/event-service';
import { canTransitionEvent } from '@/features/admin/event-schemas';
import type { AdminEventStatus } from '@/features/admin/event-schemas';
import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import {
  checkInAction,
  createEventAction,
  registerAttendeeAction,
  transitionEventAction,
} from './actions';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function EventosPage() {
  const admin = await requireCapability('events.read');
  const events = await getEventWorkspace(admin);
  const canManage = admin.capabilities.includes('events.manage');
  const canCheckIn = admin.capabilities.includes('events.checkin');
  return (
    <AdminShell admin={admin} currentPath="/admin/eventos">
      <main className="admin-module-main">
        <header className="admin-module-header">
          <p className="admin-module-eyebrow">TUESTE · EVENTOS</p>
          <h1>Boletería y eventos</h1>
          <p>Agenda, cupos, lista de espera, tickets únicos y control de ingreso.</p>
        </header>

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
