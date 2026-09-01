import { listAdminUsers } from '@/features/admin/identity-service';
import { AdminShell } from '../AdminShell';
import {
  assignRoleAction,
  changeUserStatusAction,
  inviteUserAction,
  revokeRoleAction,
  updateRoleCapabilitiesAction,
  createVendorAction,
  updateVendorAction,
} from './actions';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  const { admin, users, roles, vendors, capabilities } = await listAdminUsers();
  const roleById = new Map(roles.map((role) => [role.id, role]));
  return (
    <AdminShell admin={admin} currentPath="/admin/usuarios">
      <main className="admin-module-main">
        <header className="admin-module-header">
          <p className="admin-module-eyebrow">TUESTE · PLATAFORMA</p>
          <h1>Usuarios y roles</h1>
          <p>
            Gestiona el acceso del equipo. La invitación crea el registro; el acceso real continúa
            dependiendo de Google OAuth.
          </p>
        </header>
        <section className="admin-module-section">
          <h2>Invitar usuario</h2>
          <form action={inviteUserAction} className={styles.form}>
            <div className={styles.grid}>
              <label className={styles.label}>
                Correo
                <input className={styles.input} name="email" type="email" required />
              </label>
              <label className={styles.label}>
                Nombre
                <input className={styles.input} name="displayName" required maxLength={120} />
              </label>
            </div>
            <label className={styles.label}>
              Razón
              <input
                className={styles.input}
                name="reason"
                required
                minLength={3}
                maxLength={300}
                placeholder="Razón de la invitación"
              />
            </label>
            <button className={styles.button} type="submit">
              Crear invitación
            </button>
          </form>
        </section>
        <section className="admin-module-section">
          <h2>Equipo ({users.length})</h2>
          {users.length === 0 ? (
            <p>No hay usuarios registrados.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Estado</th>
                  <th>Roles</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.displayName}</strong>
                      <br />
                      <span className={styles.small}>{user.email}</span>
                    </td>
                    <td>{user.status}</td>
                    <td>
                      <div className={styles.form}>
                        <span className={styles.small}>
                          {user.roleIds
                            .map((id) => roleById.get(id)?.key ?? 'rol desconocido')
                            .join(', ') || 'Sin roles'}
                        </span>
                        <form action={assignRoleAction} className={styles.form}>
                          <input type="hidden" name="userId" value={user.id} />
                          <select className={styles.select} name="roleId" defaultValue="" required>
                            <option value="" disabled>
                              Añadir rol
                            </option>
                            {roles
                              .filter((role) => !user.roleIds.includes(role.id))
                              .map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.key}
                                </option>
                              ))}
                          </select>
                          <input
                            className={styles.input}
                            name="reason"
                            minLength={3}
                            required
                            placeholder="Razón"
                          />
                          <button className={styles.button} type="submit">
                            Asignar
                          </button>
                        </form>
                        {user.roleIds.map((roleId) => (
                          <form key={roleId} action={revokeRoleAction} className={styles.form}>
                            <input type="hidden" name="userId" value={user.id} />
                            <input type="hidden" name="roleId" value={roleId} />
                            <input
                              className={styles.input}
                              name="reason"
                              minLength={3}
                              required
                              placeholder={`Quitar ${roleById.get(roleId)?.key ?? 'rol'}`}
                            />
                            <button className={styles.button} type="submit">
                              Quitar
                            </button>
                          </form>
                        ))}
                      </div>
                    </td>
                    <td>
                      {user.id === admin.id ? (
                        <span className={styles.small}>Sesión actual</span>
                      ) : (
                        <form action={changeUserStatusAction} className={styles.form}>
                          <input type="hidden" name="userId" value={user.id} />
                          <select
                            className={styles.select}
                            name="status"
                            defaultValue={user.status}
                          >
                            <option value="invited">Invitado</option>
                            <option value="active">Activo</option>
                            <option value="suspended">Suspendido</option>
                          </select>
                          <input
                            className={styles.input}
                            name="reason"
                            required
                            minLength={3}
                            placeholder="Razón"
                          />
                          <button className={styles.button} type="submit">
                            Guardar
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="admin-module-section">
          <h2>Permisos por rol</h2>
          <p className={styles.small}>
            Estos permisos son efectivos en el servidor. Owner permanece completo e inmutable.
          </p>
          <div className={styles.cards}>
            {roles.map((role) => (
              <article className={styles.card} key={role.id}>
                <header>
                  <h3>{role.name}</h3>
                  <p className={styles.small}>{role.description}</p>
                </header>
                {role.key === 'owner' ? (
                  <p className={styles.badge}>
                    Acceso total · {role.capabilities.length} capacidades
                  </p>
                ) : (
                  <form action={updateRoleCapabilitiesAction} className={styles.form}>
                    <input type="hidden" name="roleId" value={role.id} />
                    <div className={styles.capabilities}>
                      {capabilities.map((capability) => (
                        <label className={styles.check} key={capability}>
                          <input
                            type="checkbox"
                            name="capability"
                            value={capability}
                            defaultChecked={role.capabilities.includes(capability)}
                            disabled={capability === 'admin.access'}
                          />
                          {capability}
                          {capability === 'admin.access' ? (
                            <input type="hidden" name="capability" value="admin.access" />
                          ) : null}
                        </label>
                      ))}
                    </div>
                    <input
                      className={styles.input}
                      name="reason"
                      minLength={3}
                      maxLength={300}
                      required
                      placeholder="Razón del cambio"
                    />
                    <button className={styles.button} type="submit">
                      Guardar permisos
                    </button>
                  </form>
                )}
              </article>
            ))}
          </div>
        </section>
        <section className="admin-module-section">
          <h2>Vendedores y alcance propio</h2>
          <p className={styles.small}>
            Vincular crea el vendedor y asigna el rol correspondiente en una sola transacción.
          </p>
          <form action={createVendorAction} className={styles.form}>
            <div className={styles.grid}>
              <label className={styles.label}>
                Usuario
                <select className={styles.select} name="userId" required defaultValue="">
                  <option value="" disabled>
                    Seleccionar usuario
                  </option>
                  {users
                    .filter((user) => !vendors.some((vendor) => vendor.userIds.includes(user.id)))
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.displayName} · {user.email}
                      </option>
                    ))}
                </select>
              </label>
              <label className={styles.label}>
                Nombre comercial
                <input
                  className={styles.input}
                  name="name"
                  required
                  minLength={2}
                  maxLength={120}
                />
              </label>
              <label className={styles.label}>
                Correo
                <input className={styles.input} name="email" type="email" />
              </label>
              <label className={styles.label}>
                Teléfono
                <input className={styles.input} name="phone" maxLength={40} />
              </label>
              <label className={styles.label}>
                Comisión (%)
                <input
                  className={styles.input}
                  name="commissionPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  defaultValue="0"
                  required
                />
              </label>
              <label className={styles.label}>
                Razón
                <input
                  className={styles.input}
                  name="reason"
                  minLength={3}
                  maxLength={300}
                  required
                />
              </label>
            </div>
            <button className={styles.button} type="submit">
              Crear y vincular vendedor
            </button>
          </form>
          <div className={styles.cards}>
            {vendors.map((vendor) => {
              const user = users.find((item) => vendor.userIds.includes(item.id));
              return (
                <article className={styles.card} key={vendor.id}>
                  <h3>{vendor.name}</h3>
                  <p className={styles.small}>
                    {user?.email ?? 'Sin usuario'} · {vendor.status}
                  </p>
                  <form action={updateVendorAction} className={styles.form}>
                    <input type="hidden" name="vendorId" value={vendor.id} />
                    <select className={styles.select} name="status" defaultValue={vendor.status}>
                      <option value="active">Activo</option>
                      <option value="suspended">Suspendido</option>
                    </select>
                    <input
                      className={styles.input}
                      name="commissionPercent"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      defaultValue={vendor.commissionBps / 100}
                      required
                    />
                    <input
                      className={styles.input}
                      name="reason"
                      minLength={3}
                      maxLength={300}
                      required
                      placeholder="Razón"
                    />
                    <button className={styles.button} type="submit">
                      Actualizar vendedor
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </AdminShell>
  );
}
