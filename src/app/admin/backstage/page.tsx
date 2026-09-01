import { requireCapability } from '@/lib/auth/authorization';
import { getBackstageWorkspace } from '@/features/admin/operations-service';
import { BACKSTAGE_STATUSES, canTransitionBackstage } from '@/features/admin/operations-schemas';
import { AdminShell } from '../AdminShell';
import {
  CardGrid,
  dateTime,
  EmptyState,
  Field,
  GhostButton,
  ModuleHeader,
  Panel,
  PrimaryButton,
  RecordCard,
  Select,
  Stat,
  Stats,
  StatusBadge,
} from '../_components/AdminUi';
import { changeBackstageStatusAction, createBackstagePassAction } from './actions';
import styles from '../operations.module.css';

export const dynamic = 'force-dynamic';

export default async function BackstagePage() {
  const admin = await requireCapability('backstage.read');
  const workspace = await getBackstageWorkspace(admin);
  const canManage = admin.capabilities.includes('backstage.manage');
  return (
    <AdminShell admin={admin} currentPath="/admin/backstage">
      <main className="admin-module-main">
        <ModuleHeader
          eyebrow="TUESTE · BACKSTAGE"
          title="Backstage"
          description="Credenciales, zonas y vigencia de acceso conectadas con la agenda de eventos."
        />
        <Stats>
          <Stat value={workspace.passes.length} label="Pases" hint="Histórico" />
          <Stat
            value={workspace.passes.filter((item) => item.status === 'requested').length}
            label="Solicitudes"
            hint="Por revisar"
          />
          <Stat
            value={workspace.passes.filter((item) => item.status === 'issued').length}
            label="Emitidos"
            hint="Accesos vigentes"
          />
          <Stat
            value={new Set(workspace.passes.map((item) => item.zone)).size}
            label="Zonas"
            hint="Controladas"
          />
        </Stats>
        {canManage ? (
          <Panel
            title="Solicitar credencial"
            description="El pase comienza solicitado; aprobación y emisión son pasos separados."
          >
            <form action={createBackstagePassAction} className={styles.formGrid}>
              <Select label="Evento opcional" name="eventId">
                <option value="">Acceso independiente</option>
                {workspace.events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} · {dateTime(event.startsAt)}
                  </option>
                ))}
              </Select>
              <Field
                label="Zona"
                name="zone"
                placeholder="Escenario, prensa, producción…"
                required
              />
              <Field label="Titular" name="holderName" required />
              <Field label="Correo" name="holderEmail" type="email" required />
              <Field label="Válido desde" name="startsAt" type="datetime-local" required />
              <Field label="Válido hasta" name="endsAt" type="datetime-local" required />
              <Field label="Notas" name="notes" />
              <Field label="Razón administrativa" name="reason" required minLength={3} />
              <div className={styles.wide}>
                <PrimaryButton>Crear solicitud</PrimaryButton>
              </div>
            </form>
          </Panel>
        ) : null}
        <Panel
          title="Control de accesos"
          description="Cada credencial muestra titular, zona, evento y vigencia."
        >
          {workspace.passes.length === 0 ? (
            <EmptyState title="Sin credenciales">
              Registra la primera solicitud para iniciar el control de acceso.
            </EmptyState>
          ) : (
            <CardGrid>
              {workspace.passes.map((pass) => {
                const event = workspace.events.find((item) => item.id === pass.eventId);
                const nextStates = BACKSTAGE_STATUSES.filter((status) =>
                  canTransitionBackstage(pass.status, status),
                );
                return (
                  <RecordCard key={pass.id}>
                    <div className={styles.cardHeader}>
                      <div>
                        <h3>{pass.holderName}</h3>
                        <p className={styles.meta}>{pass.holderEmail}</p>
                      </div>
                      <StatusBadge status={pass.status} />
                    </div>
                    <div className={styles.metaRow}>
                      <div>
                        <span>Zona</span>
                        <strong>{pass.zone}</strong>
                      </div>
                      <div>
                        <span>Evento</span>
                        <strong>{event?.title ?? 'Acceso independiente'}</strong>
                      </div>
                    </div>
                    <p className={styles.muted}>
                      {dateTime(pass.startsAt)} → {dateTime(pass.endsAt)}
                    </p>
                    {canManage && nextStates.length ? (
                      <form action={changeBackstageStatusAction} className={styles.actionForm}>
                        <input type="hidden" name="id" value={pass.id} />
                        <input type="hidden" name="from" value={pass.status} />
                        <Select label="Estado" name="to" defaultValue={pass.status}>
                          {nextStates.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </Select>
                        <Field label="Razón" name="reason" required minLength={3} />
                        <GhostButton />
                      </form>
                    ) : null}
                  </RecordCard>
                );
              })}
            </CardGrid>
          )}
        </Panel>
      </main>
    </AdminShell>
  );
}
