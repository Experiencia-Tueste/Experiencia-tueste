import { requireCapability } from '@/lib/auth/authorization';
import { getUnityWorkspace } from '@/features/admin/operations-service';
import { UNITY_STAGES, canTransitionUnity } from '@/features/admin/operations-schemas';
import { AdminShell } from '../AdminShell';
import {
  CardGrid,
  currency,
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
import { changeUnityStageAction, createUnityOpportunityAction } from './actions';
import styles from '../operations.module.css';

export const dynamic = 'force-dynamic';

export default async function UnityPage() {
  const admin = await requireCapability('unity.read');
  const workspace = await getUnityWorkspace(admin);
  const canManage = admin.capabilities.includes('unity.manage');
  const totalValue = workspace.opportunities
    .filter((item) => !['lost'].includes(item.stage))
    .reduce((sum, item) => sum + (item.estimatedValueCents ?? 0), 0);
  return (
    <AdminShell admin={admin} currentPath="/admin/unity">
      <main className="admin-module-main">
        <ModuleHeader
          eyebrow="TUESTE · UNITY"
          title="Tueste Unity"
          description="Pipeline B2B para convertir conversaciones en propuestas y relaciones activas."
        />
        <Stats>
          <Stat
            value={workspace.opportunities.length}
            label="Oportunidades"
            hint="Pipeline completo"
          />
          <Stat
            value={workspace.opportunities.filter((item) => item.stage === 'proposal').length}
            label="Propuestas"
            hint="En decisión"
          />
          <Stat
            value={workspace.opportunities.filter((item) => item.stage === 'won').length}
            label="Ganadas"
            hint="Relaciones activadas"
          />
          <Stat
            value={currency(totalValue)}
            label="Valor potencial"
            hint="Sin oportunidades perdidas"
          />
        </Stats>
        <Panel title="Pipeline comercial" description="Vista rápida de la distribución por etapa.">
          <div className={styles.pipeline}>
            {UNITY_STAGES.map((stage) => (
              <div key={stage}>
                <strong>
                  {workspace.opportunities.filter((item) => item.stage === stage).length}
                </strong>
                <span>{stage}</span>
              </div>
            ))}
          </div>
        </Panel>
        {canManage ? (
          <Panel
            title="Nueva oportunidad"
            description="Registra contacto, necesidad y siguiente acción desde el primer momento."
          >
            <form action={createUnityOpportunityAction} className={styles.formGrid}>
              <Field label="Organización" name="organization" required />
              <Field label="Servicio" name="service" required />
              <Field label="Contacto" name="contactName" required />
              <Field label="Correo" name="contactEmail" type="email" required />
              <Field
                label="Valor estimado en centavos COP"
                name="estimatedValueCents"
                type="number"
                min="0"
              />
              <Field label="Próximo contacto" name="nextContactAt" type="datetime-local" />
              <Field label="Próximo paso" name="nextStep" />
              <Field label="Razón administrativa" name="reason" required minLength={3} />
              <div className={styles.wide}>
                <PrimaryButton>Crear oportunidad</PrimaryButton>
              </div>
            </form>
          </Panel>
        ) : null}
        <Panel
          title="Oportunidades"
          description="Seguimiento centralizado de cada relación comercial."
        >
          {workspace.opportunities.length === 0 ? (
            <EmptyState title="Pipeline vacío">
              Registra el primer contacto para iniciar el seguimiento.
            </EmptyState>
          ) : (
            <CardGrid>
              {workspace.opportunities.map((opportunity) => {
                const nextStages = UNITY_STAGES.filter((stage) =>
                  canTransitionUnity(opportunity.stage, stage),
                );
                return (
                  <RecordCard key={opportunity.id}>
                    <div className={styles.cardHeader}>
                      <div>
                        <h3>{opportunity.organization}</h3>
                        <p className={styles.meta}>
                          {opportunity.contactName} · {opportunity.contactEmail}
                        </p>
                      </div>
                      <StatusBadge status={opportunity.stage} />
                    </div>
                    <div className={styles.metaRow}>
                      <div>
                        <span>Servicio</span>
                        <strong>{opportunity.service}</strong>
                      </div>
                      <div>
                        <span>Valor</span>
                        <strong>{currency(opportunity.estimatedValueCents)}</strong>
                      </div>
                    </div>
                    <p className={styles.muted}>
                      {opportunity.nextStep || 'Sin próximo paso'} ·{' '}
                      {dateTime(opportunity.nextContactAt)}
                    </p>
                    {canManage && nextStages.length ? (
                      <form action={changeUnityStageAction} className={styles.actionForm}>
                        <input type="hidden" name="id" value={opportunity.id} />
                        <input type="hidden" name="from" value={opportunity.stage} />
                        <Select label="Etapa" name="to" defaultValue={opportunity.stage}>
                          {nextStages.map((stage) => (
                            <option key={stage}>{stage}</option>
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
