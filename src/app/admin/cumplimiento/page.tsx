import { getComplianceWorkspace } from '@/features/admin/compliance-service';
import { expiryState } from '@/features/admin/compliance-schemas';
import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import {
  changeRecordStatusAction,
  createFarmAction,
  createLotAction,
  createRecordAction,
} from './actions';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function CumplimientoPage() {
  const admin = await requireCapability('tree.read');
  const workspace = await getComplianceWorkspace(admin);
  const canUpdate = admin.capabilities.includes('tree.update');
  const now = new Date();
  const expiring = workspace.records.filter(
    (record) => expiryState(record.expiresAt, now) === 'por-vencer',
  ).length;
  const expired = workspace.records.filter(
    (record) => expiryState(record.expiresAt, now) === 'vencido',
  ).length;
  return (
    <AdminShell admin={admin} currentPath="/admin/cumplimiento">
      <main className="admin-module-main">
        <header className="admin-module-header">
          <p className="admin-module-eyebrow">TUESTE · FINCA</p>
          <h1>Cumplimiento y finca</h1>
          <p>Fincas, lotes, certificaciones, inspecciones y vencimientos trazables.</p>
        </header>
        <section className="admin-module-section">
          <div className={styles.columns}>
            <Stat value={workspace.farms.length} label="Fincas" />
            <Stat value={workspace.lots.length} label="Lotes" />
            <Stat value={expiring + expired} label="Alertas" />
          </div>
        </section>
        {canUpdate ? (
          <section className="admin-module-section">
            <h2>Registrar operación</h2>
            <div className={styles.columns}>
              <form action={createFarmAction} className={styles.form}>
                <h3>Nueva finca</h3>
                <Field name="name" label="Nombre" required />
                <Field name="producerName" label="Productor" required />
                <Field name="city" label="Ciudad" required />
                <Field name="region" label="Región" required />
                <Field name="contactEmail" label="Correo" type="email" />
                <Field name="reason" label="Razón" required minLength={3} />
                <button className={styles.button}>Crear finca</button>
              </form>
              <form action={createLotAction} className={styles.form}>
                <h3>Nuevo lote</h3>
                <SelectFarm farms={workspace.farms} />
                <Field name="code" label="Código" required />
                <Field
                  name="harvestYear"
                  label="Cosecha"
                  type="number"
                  min="2000"
                  max="2200"
                  required
                />
                <Field name="variety" label="Variedad" required />
                <Field name="process" label="Proceso" required />
                <Field name="weightKg" label="Peso kg" type="number" min="0" step="0.01" />
                <Field name="reason" label="Razón" required minLength={3} />
                <button className={styles.button}>Crear lote</button>
              </form>
              <form action={createRecordAction} className={styles.form}>
                <h3>Documento o inspección</h3>
                <SelectFarm farms={workspace.farms} />
                <label className={styles.label}>
                  Lote opcional
                  <select className={styles.select} name="lotId">
                    <option value="">Toda la finca</option>
                    {workspace.lots.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.code}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  Tipo
                  <select className={styles.select} name="kind">
                    <option value="certificate">Certificado</option>
                    <option value="inspection">Inspección</option>
                    <option value="document">Documento</option>
                    <option value="communication">Comunicación</option>
                  </select>
                </label>
                <Field name="title" label="Título" required />
                <Field name="reference" label="Referencia" />
                <Field name="issuedAt" label="Emisión" type="date" />
                <Field name="expiresAt" label="Vencimiento" type="date" />
                <Field name="notes" label="Notas" />
                <Field name="reason" label="Razón" required minLength={3} />
                <button className={styles.button}>Registrar</button>
              </form>
            </div>
          </section>
        ) : null}
        <section className="admin-module-section">
          <h2>Fincas y trazabilidad</h2>
          {workspace.farms.length === 0 ? (
            <p className={styles.empty}>Aún no hay fincas registradas.</p>
          ) : (
            <div className={styles.cards}>
              {workspace.farms.map((farm) => {
                const lots = workspace.lots.filter((l) => l.farmId === farm.id);
                const records = workspace.records.filter((r) => r.farmId === farm.id);
                return (
                  <article className={styles.card} key={farm.id}>
                    <h2>{farm.name}</h2>
                    <p className={styles.meta}>
                      {farm.producerName} · {farm.city}, {farm.region}
                    </p>
                    <span className={styles.badge}>{farm.status}</span>
                    <h3>Lotes ({lots.length})</h3>
                    {lots.map((lot) => (
                      <p className={styles.meta} key={lot.id}>
                        {lot.code} · {lot.variety} · {lot.process} · {lot.harvestYear}
                      </p>
                    ))}
                    <h3>Registros ({records.length})</h3>
                    <div className={styles.list}>
                      {records.map((record) => (
                        <div className={styles.record} key={record.id}>
                          <h3>{record.title}</h3>
                          <p className={styles.meta}>
                            {record.kind} · {record.status} · {expiryState(record.expiresAt, now)}
                          </p>
                          {canUpdate ? (
                            <form action={changeRecordStatusAction} className={styles.grid}>
                              <input type="hidden" name="id" value={record.id} />
                              <label className={styles.label}>
                                Estado
                                <select
                                  className={styles.select}
                                  name="status"
                                  defaultValue={record.status}
                                >
                                  <option value="pending">Pendiente</option>
                                  <option value="valid">Válido</option>
                                  <option value="rejected">Rechazado</option>
                                  <option value="archived">Archivado</option>
                                </select>
                              </label>
                              <Field name="reason" label="Razón" required minLength={3} />
                              <button className={styles.button}>Actualizar</button>
                            </form>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </AdminShell>
  );
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={styles.label}>
      {label}
      <input className={styles.input} {...props} />
    </label>
  );
}
function SelectFarm({ farms }: { farms: Array<{ id: string; name: string }> }) {
  return (
    <label className={styles.label}>
      Finca
      <select className={styles.select} name="farmId" required>
        <option value="">Seleccionar</option>
        {farms.map((farm) => (
          <option key={farm.id} value={farm.id}>
            {farm.name}
          </option>
        ))}
      </select>
    </label>
  );
}
function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className={styles.stat}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
