import { listAdminSettings } from '@/features/admin/config-service';
import { AdminShell } from '../AdminShell';
import { updateSettingAction } from './actions';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage() {
  const { admin, settings } = await listAdminSettings();
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
        </div>
      </main>
    </AdminShell>
  );
}
