import { getCommunityWorkspace } from '@/features/admin/community-service';
import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import {
  changeMemberStatusAction,
  changePostStatusAction,
  createMemberAction,
  createPostAction,
  createReportAction,
  resolveReportAction,
} from './actions';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function ComunidadPage() {
  const admin = await requireCapability('community.read');
  const workspace = await getCommunityWorkspace(admin);
  const canModerate = admin.capabilities.includes('community.moderate');
  const openReports = workspace.reports.filter((report) => report.status === 'open');
  const restricted = workspace.members.filter((member) => member.status !== 'active');

  return (
    <AdminShell admin={admin} currentPath="/admin/comunidad">
      <main className="admin-module-main">
        <header className="admin-module-header">
          <p className="admin-module-eyebrow">TUESTE · COMUNIDAD</p>
          <h1>Comunidad y TuesteX</h1>
          <p>Miembros, publicaciones, reportes y decisiones de moderación trazables.</p>
        </header>

        <section className="admin-module-section">
          <div className={styles.stats}>
            <Stat value={workspace.members.length} label="Miembros" />
            <Stat value={workspace.posts.length} label="Publicaciones" />
            <Stat value={openReports.length} label="Reportes abiertos" />
            <Stat value={restricted.length} label="Restringidos" />
          </div>
        </section>

        {canModerate ? (
          <section className="admin-module-section">
            <h2>Ingreso operativo</h2>
            <div className={styles.formGrid}>
              <form action={createMemberAction} className={styles.form}>
                <h3>Nuevo miembro</h3>
                <Field name="displayName" label="Nombre visible" required />
                <Field name="email" label="Correo" type="email" required />
                <Field name="notes" label="Notas" />
                <Field name="reason" label="Razón" required minLength={3} />
                <button className={styles.button}>Registrar miembro</button>
              </form>
              <form action={createPostAction} className={styles.form}>
                <h3>Registrar publicación</h3>
                <label className={styles.label}>
                  Miembro opcional
                  <select className={styles.select} name="memberId">
                    <option value="">Autor externo</option>
                    {workspace.members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.displayName}
                      </option>
                    ))}
                  </select>
                </label>
                <Field name="authorName" label="Autor" required />
                <Field name="title" label="Título" required />
                <Area name="body" label="Contenido" required />
                <Field name="reason" label="Razón" required minLength={3} />
                <button className={styles.button}>Registrar publicación</button>
              </form>
              <form action={createReportAction} className={styles.form}>
                <h3>Nuevo reporte</h3>
                <label className={styles.label}>
                  Publicación
                  <select className={styles.select} name="postId" required>
                    <option value="">Seleccionar</option>
                    {workspace.posts.map((post) => (
                      <option key={post.id} value={post.id}>
                        {post.title}
                      </option>
                    ))}
                  </select>
                </label>
                <Field name="reporterName" label="Reportado por" required />
                <label className={styles.label}>
                  Categoría
                  <select className={styles.select} name="category">
                    <option value="spam">Spam</option>
                    <option value="harassment">Acoso</option>
                    <option value="misinformation">Desinformación</option>
                    <option value="copyright">Derechos de autor</option>
                    <option value="other">Otro</option>
                  </select>
                </label>
                <Area name="details" label="Detalles" />
                <Field name="reason" label="Razón" required minLength={3} />
                <button className={styles.button}>Abrir reporte</button>
              </form>
            </div>
          </section>
        ) : null}

        <section className="admin-module-section">
          <div className={styles.sectionHeader}>
            <div>
              <p className="admin-module-eyebrow">COLA PRIORITARIA</p>
              <h2>Reportes abiertos</h2>
            </div>
            <span className={styles.count}>{openReports.length}</span>
          </div>
          {openReports.length === 0 ? (
            <p className={styles.empty}>No hay reportes pendientes.</p>
          ) : (
            <div className={styles.cards}>
              {openReports.map((report) => {
                const post = workspace.posts.find((item) => item.id === report.postId);
                return (
                  <article className={styles.card} key={report.id}>
                    <span className={styles.badge}>{report.category}</span>
                    <h3>{post?.title ?? 'Publicación eliminada'}</h3>
                    <p className={styles.meta}>Reportado por {report.reporterName}</p>
                    {report.details ? <p>{report.details}</p> : null}
                    {canModerate ? (
                      <form action={resolveReportAction} className={styles.compactForm}>
                        <input type="hidden" name="id" value={report.id} />
                        <input type="hidden" name="from" value="open" />
                        <label className={styles.label}>
                          Decisión
                          <select className={styles.select} name="to">
                            <option value="resolved">Resuelto</option>
                            <option value="dismissed">Descartado</option>
                          </select>
                        </label>
                        <Field name="resolution" label="Resolución" required minLength={3} />
                        <Field name="reason" label="Razón" required minLength={3} />
                        <button className={styles.button}>Cerrar reporte</button>
                      </form>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="admin-module-section">
          <h2>Publicaciones</h2>
          {workspace.posts.length === 0 ? (
            <p className={styles.empty}>Aún no hay publicaciones registradas.</p>
          ) : (
            <div className={styles.cards}>
              {workspace.posts.map((post) => (
                <article className={styles.card} key={post.id}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h3>{post.title}</h3>
                      <p className={styles.meta}>{post.authorName}</p>
                    </div>
                    <span className={styles.badge}>{post.status}</span>
                  </div>
                  <p>{post.body}</p>
                  <p className={styles.meta}>{post.reportCount} reportes</p>
                  {canModerate ? (
                    <form action={changePostStatusAction} className={styles.compactForm}>
                      <input type="hidden" name="id" value={post.id} />
                      <input type="hidden" name="from" value={post.status} />
                      <label className={styles.label}>
                        Estado
                        <select className={styles.select} name="to" defaultValue={post.status}>
                          <option value="visible">Visible</option>
                          <option value="hidden">Oculta</option>
                          <option value="removed">Eliminada</option>
                        </select>
                      </label>
                      <Field name="reason" label="Razón" required minLength={3} />
                      <button className={styles.buttonGhost}>Actualizar</button>
                    </form>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="admin-module-section">
          <h2>Miembros</h2>
          {workspace.members.length === 0 ? (
            <p className={styles.empty}>Aún no hay miembros registrados.</p>
          ) : (
            <div className={styles.memberGrid}>
              {workspace.members.map((member) => (
                <article className={styles.member} key={member.id}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h3>{member.displayName}</h3>
                      <p className={styles.meta}>{member.email}</p>
                    </div>
                    <span className={styles.badge}>{member.status}</span>
                  </div>
                  {canModerate ? (
                    <form action={changeMemberStatusAction} className={styles.compactForm}>
                      <input type="hidden" name="id" value={member.id} />
                      <input type="hidden" name="from" value={member.status} />
                      <label className={styles.label}>
                        Estado
                        <select className={styles.select} name="to" defaultValue={member.status}>
                          <option value="active">Activo</option>
                          <option value="restricted">Restringido</option>
                          <option value="banned">Bloqueado</option>
                        </select>
                      </label>
                      <Field name="reason" label="Razón" required minLength={3} />
                      <button className={styles.buttonGhost}>Actualizar</button>
                    </form>
                  ) : null}
                </article>
              ))}
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

function Area({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className={styles.label}>
      {label}
      <textarea className={styles.textarea} {...props} />
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
