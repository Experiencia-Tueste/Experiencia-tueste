import { RADIO_PLANS } from '@/features/radio';
import { getRadioWorkspace } from '@/features/admin/radio-service';
import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import { changeSubscriptionAction, createChannelAction, createCompanyAction } from './actions';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function RadioPage() {
  const admin = await requireCapability('radio.read');
  const workspace = await getRadioWorkspace(admin);
  const canManage = admin.capabilities.includes('radio.manage');
  const active = workspace.channels.filter(
    (channel) => channel.subscriptionStatus === 'active',
  ).length;
  const pending = workspace.channels.filter((channel) =>
    ['pending', 'trial'].includes(channel.subscriptionStatus),
  ).length;
  return (
    <AdminShell admin={admin} currentPath="/admin/radio">
      <main className="admin-module-main">
        <header className="admin-module-header">
          <p className="admin-module-eyebrow">TUESTE · RADIO ORIGEN</p>
          <h1>Radio Origen B2B</h1>
          <p>
            Empresas, canales, planes y suscripciones operativas; la cobranza se conectará en la
            fase de pagos.
          </p>
        </header>
        <section className="admin-module-section">
          <div className={styles.stats}>
            <Stat value={workspace.companies.length} label="Empresas" />
            <Stat value={active} label="Suscripciones activas" />
            <Stat value={pending} label="Por activar" />
          </div>
        </section>
        {canManage ? (
          <section className="admin-module-section">
            <h2>Alta comercial</h2>
            <div className={styles.forms}>
              <form action={createCompanyAction} className={styles.form}>
                <h3>Nueva empresa</h3>
                <Field name="name" label="Empresa" required />
                <Field name="contactName" label="Contacto" required />
                <Field name="contactEmail" label="Correo" type="email" required />
                <Field name="city" label="Ciudad" required />
                <Field name="reason" label="Razón" required minLength={3} />
                <button className={styles.button}>Registrar empresa</button>
              </form>
              <form action={createChannelAction} className={styles.form}>
                <h3>Nuevo canal / suscripción</h3>
                <label className={styles.label}>
                  Empresa
                  <select className={styles.select} name="companyId" required>
                    <option value="">Seleccionar</option>
                    {workspace.companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </label>
                <Field name="name" label="Nombre del canal" required />
                <label className={styles.label}>
                  Plan
                  <select className={styles.select} name="planId">
                    {RADIO_PLANS.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.nombre} · USD {plan.priceUsd}/mes
                      </option>
                    ))}
                  </select>
                </label>
                <Field name="notes" label="Notas de programación" />
                <Field name="reason" label="Razón" required minLength={3} />
                <button className={styles.button}>Crear canal</button>
              </form>
            </div>
          </section>
        ) : null}
        <section className="admin-module-section">
          <h2>Empresas y señales</h2>
          {workspace.companies.length === 0 ? (
            <p className={styles.empty}>Aún no hay empresas registradas.</p>
          ) : (
            <div className={styles.cards}>
              {workspace.companies.map((company) => {
                const channels = workspace.channels.filter(
                  (channel) => channel.companyId === company.id,
                );
                return (
                  <article className={styles.card} key={company.id}>
                    <div className={styles.header}>
                      <div>
                        <h3>{company.name}</h3>
                        <p className={styles.meta}>
                          {company.contactName} · {company.contactEmail} · {company.city}
                        </p>
                      </div>
                      <span className={styles.badge}>{company.status}</span>
                    </div>
                    {channels.length === 0 ? (
                      <p className={styles.empty}>Sin canales.</p>
                    ) : (
                      channels.map((channel) => (
                        <div className={styles.compact} key={channel.id}>
                          <div className={styles.header}>
                            <div>
                              <strong>{channel.name}</strong>
                              <p className={styles.meta}>
                                {RADIO_PLANS.find((plan) => plan.id === channel.planId)?.nombre ??
                                  channel.planId}
                              </p>
                            </div>
                            <span className={styles.badge}>{channel.subscriptionStatus}</span>
                          </div>
                          {canManage ? (
                            <form action={changeSubscriptionAction} className={styles.compact}>
                              <input type="hidden" name="id" value={channel.id} />
                              <input type="hidden" name="from" value={channel.subscriptionStatus} />
                              <label className={styles.label}>
                                Suscripción
                                <select
                                  className={styles.select}
                                  name="to"
                                  defaultValue={channel.subscriptionStatus}
                                >
                                  <option value="pending">Pendiente</option>
                                  <option value="trial">Prueba</option>
                                  <option value="active">Activa</option>
                                  <option value="paused">Pausada</option>
                                  <option value="cancelled">Cancelada</option>
                                </select>
                              </label>
                              <Field name="reason" label="Razón" required minLength={3} />
                              <button className={styles.ghost}>Actualizar</button>
                            </form>
                          ) : null}
                        </div>
                      ))
                    )}
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
function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className={styles.stat}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
