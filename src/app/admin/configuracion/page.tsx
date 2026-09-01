import { listAdminSettings } from '@/features/admin/config-service';
import { AdminShell } from '../AdminShell';
import { updateIntegrationAction, updateSettingAction, upsertCouponAction } from './actions';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage() {
  const { admin, settings, integrations, coupons } = await listAdminSettings();
  const groups = Map.groupBy(settings, (setting) => setting.group);

  return (
    <AdminShell admin={admin} currentPath="/admin/configuracion">
      <main className="admin-module-main">
        <header className="admin-module-header">
          <p className="admin-module-eyebrow">TUESTE · PLATAFORMA</p>
          <h1>Configuración</h1>
          <p>Administra valores públicos de marca, contacto, comercio e integraciones.</p>
        </header>

        <p className={styles.notice}>
          Este módulo nunca guarda contraseñas, tokens ni secretos. Las credenciales sensibles se
          mantienen exclusivamente en las variables protegidas de Railway.
        </p>

        <div className={styles.groups}>
          {Array.from(groups.entries()).map(([group, groupSettings]) => (
            <section className={styles.group} key={group}>
              <header className={styles.groupHeader}>
                <h2>{group}</h2>
                <span>{groupSettings.length} campos</span>
              </header>
              <div className={styles.cards}>
                {groupSettings.map((setting) => (
                  <article className={styles.card} key={setting.key}>
                    <h3>{setting.label}</h3>
                    <p className={styles.description}>{setting.description}</p>
                    <form action={updateSettingAction} className={styles.form}>
                      <input name="key" type="hidden" value={setting.key} />
                      <label className={styles.label}>
                        Valor
                        <input
                          className={styles.input}
                          name="value"
                          type={setting.type}
                          defaultValue={setting.value}
                          placeholder={setting.placeholder}
                          required={setting.key === 'brand.display_name'}
                          maxLength={500}
                        />
                      </label>
                      <label className={styles.label}>
                        Razón del cambio
                        <input
                          className={styles.input}
                          name="reason"
                          required
                          minLength={3}
                          maxLength={300}
                          placeholder="Queda registrada en auditoría"
                        />
                      </label>
                      {setting.updatedAt ? (
                        <span className={styles.meta}>
                          Actualizado {new Date(setting.updatedAt).toLocaleString('es-CO')}
                        </span>
                      ) : (
                        <span className={styles.meta}>Sin valor guardado</span>
                      )}
                      <button className={styles.button} type="submit">
                        Guardar campo
                      </button>
                    </form>
                  </article>
                ))}
              </div>
            </section>
          ))}
          <section className={styles.group}>
            <header className={styles.groupHeader}>
              <h2>Estado de integraciones</h2>
              <span>{integrations.length} registradas</span>
            </header>
            <p className={styles.description}>
              Solo guarda estado y referencias públicas. Los tokens continúan en Railway.
            </p>
            <div className={styles.cards}>
              {[
                ...integrations,
                {
                  id: 'new',
                  provider: '',
                  label: '',
                  status: 'disconnected' as const,
                  publicReference: '',
                  updatedAt: '',
                },
              ].map((integration) => (
                <article className={styles.card} key={integration.id}>
                  <h3>{integration.label || 'Añadir integración'}</h3>
                  <form action={updateIntegrationAction} className={styles.form}>
                    <label className={styles.label}>
                      Proveedor
                      <input
                        className={styles.input}
                        name="provider"
                        defaultValue={integration.provider}
                        required
                        pattern="[a-z0-9_-]+"
                        readOnly={integration.id !== 'new'}
                      />
                    </label>
                    <label className={styles.label}>
                      Nombre visible
                      <input
                        className={styles.input}
                        name="label"
                        defaultValue={integration.label}
                        required
                      />
                    </label>
                    <label className={styles.label}>
                      Estado
                      <select
                        className={styles.input}
                        name="status"
                        defaultValue={integration.status}
                      >
                        <option value="disconnected">Sin conectar</option>
                        <option value="configured">Configurada</option>
                        <option value="degraded">Degradada</option>
                        <option value="disabled">Deshabilitada</option>
                      </select>
                    </label>
                    <label className={styles.label}>
                      Referencia pública
                      <input
                        className={styles.input}
                        name="publicReference"
                        defaultValue={integration.publicReference ?? ''}
                        maxLength={500}
                      />
                    </label>
                    <label className={styles.label}>
                      Razón
                      <input
                        className={styles.input}
                        name="reason"
                        required
                        minLength={3}
                        maxLength={300}
                      />
                    </label>
                    <button className={styles.button} type="submit">
                      Guardar integración
                    </button>
                  </form>
                </article>
              ))}
            </div>
          </section>
          <section className={styles.group}>
            <header className={styles.groupHeader}>
              <h2>Referencias de cupones</h2>
              <span>{coupons.length} códigos</span>
            </header>
            <div className={styles.cards}>
              {[
                ...coupons,
                {
                  id: 'new',
                  code: '',
                  label: '',
                  externalId: '',
                  status: 'active' as const,
                  updatedAt: '',
                },
              ].map((coupon) => (
                <article className={styles.card} key={coupon.id}>
                  <h3>{coupon.code || 'Añadir referencia'}</h3>
                  <form action={upsertCouponAction} className={styles.form}>
                    <label className={styles.label}>
                      Código
                      <input
                        className={styles.input}
                        name="code"
                        defaultValue={coupon.code}
                        required
                        pattern="[A-Za-z0-9_-]+"
                        readOnly={coupon.id !== 'new'}
                      />
                    </label>
                    <label className={styles.label}>
                      Etiqueta
                      <input
                        className={styles.input}
                        name="label"
                        defaultValue={coupon.label}
                        required
                      />
                    </label>
                    <label className={styles.label}>
                      ID externo
                      <input
                        className={styles.input}
                        name="externalId"
                        defaultValue={coupon.externalId ?? ''}
                      />
                    </label>
                    <label className={styles.label}>
                      Estado
                      <select className={styles.input} name="status" defaultValue={coupon.status}>
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                        <option value="expired">Expirado</option>
                      </select>
                    </label>
                    <label className={styles.label}>
                      Razón
                      <input
                        className={styles.input}
                        name="reason"
                        required
                        minLength={3}
                        maxLength={300}
                      />
                    </label>
                    <button className={styles.button} type="submit">
                      Guardar cupón
                    </button>
                  </form>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </AdminShell>
  );
}
