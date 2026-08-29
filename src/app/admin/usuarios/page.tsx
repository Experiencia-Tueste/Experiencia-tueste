import { listAdminUsers } from '@/features/admin/identity-service';
import { AdminShell } from '../AdminShell';
import {
  assignRoleAction,
  changeUserStatusAction,
  inviteUserAction,
  revokeRoleAction,
} from './actions';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  const { admin, users, roles } = await listAdminUsers();
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
      </main>
    </AdminShell>
  );
}
