import { requireCapability } from '@/lib/auth/authorization';
import { getTreeWorkspace } from '@/features/admin/operations-service';
import { TREE_STATUSES, canTransitionTree } from '@/features/admin/operations-schemas';
import { AdminShell } from '../AdminShell';
import {
  CardGrid,
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
  dateTime,
} from '../_components/AdminUi';
import { changeTreeStatusAction, createTreeAdoptionAction } from './actions';
import styles from '../operations.module.css';

export const dynamic = 'force-dynamic';

export default async function AdopcionesPage() {
  const admin = await requireCapability('tree.read');
  const workspace = await getTreeWorkspace(admin);
  const canManage = admin.capabilities.includes('tree.update');
  const active = workspace.adoptions.filter((item) => item.status === 'active').length;
  const treeCount = workspace.adoptions
    .filter((item) => item.status !== 'cancelled')
    .reduce((total, item) => total + item.treesCount, 0);
  return (
    <AdminShell admin={admin} currentPath="/admin/adopciones">
      <main className="admin-module-main">
        <ModuleHeader
          eyebrow="TUESTE · TREE"
          title="Tueste Tree"
          description="Adopciones trazables desde el lote de origen hasta el certificado del adoptante."
        />
        <Stats>
          <Stat value={workspace.adoptions.length} label="Adopciones" hint="Histórico total" />
          <Stat value={active} label="Activas" hint="En seguimiento" />
          <Stat value={treeCount} label="Árboles" hint="No cancelados" />
          <Stat value={workspace.lots.length} label="Lotes elegibles" hint="Origen persistido" />
        </Stats>

        {canManage ? (
          <Panel
            title="Registrar adopción"
            description="Toda adopción queda vinculada a un lote y registrada en auditoría."
          >
            {workspace.lots.length === 0 ? (
              <EmptyState title="Primero registra un lote">
                Crea la finca y su lote desde Cumplimiento y finca.
              </EmptyState>
            ) : (
              <form action={createTreeAdoptionAction} className={styles.formGrid}>
                <Select label="Lote de origen" name="lotId" required>
                  <option value="">Seleccionar lote</option>
                  {workspace.lots.map((lot) => {
                    const farm = workspace.farms.find((item) => item.id === lot.farmId);
                    return (
                      <option key={lot.id} value={lot.id}>
                        {lot.code} · {farm?.name ?? 'Finca'}
                      </option>
                    );
                  })}
                </Select>
                <Field
                  label="Código de certificado"
                  name="certificateCode"
                  placeholder="TREE-2026-001"
                  required
                />
                <Field label="Adoptante" name="adopterName" required />
                <Field label="Correo" name="adopterEmail" type="email" required />
                <Field
                  label="Número de árboles"
                  name="treesCount"
                  type="number"
                  min="1"
                  defaultValue="1"
                  required
                />
                <Field label="Notas" name="notes" />
                <Field label="Razón administrativa" name="reason" minLength={3} required />
                <div className={styles.wide}>
                  <PrimaryButton>Registrar adopción</PrimaryButton>
                </div>
              </form>
            )}
          </Panel>
        ) : null}

        <Panel
          title="Adopciones y seguimiento"
          description="Consulta certificados, origen y estado operativo."
        >
          {workspace.adoptions.length === 0 ? (
            <EmptyState title="Aún no hay adopciones">
              La primera adopción aparecerá aquí con su trazabilidad completa.
            </EmptyState>
          ) : (
            <CardGrid>
              {workspace.adoptions.map((adoption) => {
                const lot = workspace.lots.find((item) => item.id === adoption.lotId);
                const farm = workspace.farms.find((item) => item.id === lot?.farmId);
                const nextStates = TREE_STATUSES.filter((status) =>
                  canTransitionTree(adoption.status, status),
                );
                return (
                  <RecordCard key={adoption.id}>
                    <div className={styles.cardHeader}>
                      <div>
                        <h3>{adoption.adopterName}</h3>
                        <p className={styles.meta}>{adoption.adopterEmail}</p>
                      </div>
                      <StatusBadge status={adoption.status} />
                    </div>
                    <div className={styles.metaRow}>
                      <div>
                        <span>Certificado</span>
                        <strong>{adoption.certificateCode}</strong>
                      </div>
                      <div>
                        <span>Árboles</span>
                        <strong>{adoption.treesCount}</strong>
                      </div>
                    </div>
                    <p className={styles.meta}>
                      Origen: {farm?.name ?? 'Finca'} · lote {lot?.code ?? 'sin referencia'}
                      <br />
                      Creada {dateTime(adoption.createdAt)}
                    </p>
                    {canManage && nextStates.length ? (
                      <form action={changeTreeStatusAction} className={styles.actionForm}>
                        <input type="hidden" name="id" value={adoption.id} />
                        <input type="hidden" name="from" value={adoption.status} />
                        <Select label="Estado" name="to" defaultValue={adoption.status}>
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
