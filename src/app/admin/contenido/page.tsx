import type { Metadata } from 'next';
import {
  AssetRegistrationForm,
  AssetUploadForm,
  AssetRowActions,
  CreateDraftForm,
  CreateReleaseForm,
  ContentRowActions,
  ReleaseRowActions,
} from './ContenidoForms';
import { getContentWorkspace } from '@/features/admin/content-service';
import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import styles from '../Admin.module.css';

/**
 * Metadata de la sección de contenido.
 */
export const metadata: Metadata = {
  title: 'Contenido · Panel Tueste',
  description: 'Gestión editorial de contenido, lanzamientos y pistas del panel Tueste.',
};

/**
 * /admin/contenido — gestión editorial de contenido (Fase 3).
 *
 * Protegida con requireCapability('content.read'). El listado y las
 * acciones disponibles dependen de las capacidades del usuario
 * (content.read / content.edit / content.publish). Sin datos demo:
 * los estados vacíos y los errores son reales.
 */
export default async function AdminContentPage() {
  const admin = await requireCapability('content.read');
  const canEdit = admin.capabilities.includes('content.edit');
  const canPublish = admin.capabilities.includes('content.publish');
  const workspace = await getContentWorkspace(admin);

  return (
    <AdminShell admin={admin} currentPath="/admin/contenido">
      <main className={styles.main}>
        <header className={styles.contentHeader}>
          <p className={styles.kicker}>TUESTE · EDITORIAL</p>
          <h1 className={styles.title}>Contenido</h1>
          <p className={styles.text}>
            Sesión: {admin.email} · Rol persistido: {admin.role}
          </p>
        </header>

        <section className={styles.section} aria-labelledby="contenido-titulo">
          <h2 id="contenido-titulo" className={styles.statusTitle}>
            Entradas editoriales
          </h2>

          {workspace.content.length === 0 ? (
            <p className={styles.empty}>Aún no hay contenido. Crea el primer borrador.</p>
          ) : (
            <ul className={styles.list}>
              {workspace.content.map((row) => (
                <li key={row.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <strong className={styles.rowTitle}>{row.title}</strong>
                    <span className={styles.rowMeta}>
                      {row.slug} · v{row.version} · {row.status}
                    </span>
                  </div>
                  {canEdit || canPublish ? (
                    <ContentRowActions row={row} canEdit={canEdit} canPublish={canPublish} />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.section} aria-labelledby="lanzamientos-titulo">
          <h2 id="lanzamientos-titulo" className={styles.statusTitle}>
            Lanzamientos y pistas
          </h2>
          {workspace.releases.length === 0 ? (
            <p className={styles.empty}>Aún no hay lanzamientos registrados.</p>
          ) : (
            <ul className={styles.list}>
              {workspace.releases.map((release) => (
                <li key={release.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <strong className={styles.rowTitle}>{release.title}</strong>
                    <span className={styles.rowMeta}>
                      {release.slug} · {release.status} · {release.tracks.length} pista
                      {release.tracks.length === 1 ? '' : 's'}
                    </span>
                    {release.tracks.length > 0 ? (
                      <ol className={styles.compactList}>
                        {release.tracks.map((track) => (
                          <li key={track.id}>
                            {track.title}
                            {track.hz ? ` · ${track.hz} Hz` : ''}
                            {track.durationSeconds ? ` · ${track.durationSeconds}s` : ''}
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </div>
                  {canEdit || canPublish ? (
                    <ReleaseRowActions
                      id={release.id}
                      status={release.status}
                      canEdit={canEdit}
                      canPublish={canPublish}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.section} aria-labelledby="assets-titulo">
          <div className={styles.sectionHeader}>
            <div>
              <h2 id="assets-titulo" className={styles.statusTitle}>
                Biblioteca de activos
              </h2>
              <p className={styles.empty}>
                Storage {workspace.storage.configured ? 'configurado' : 'pendiente de configurar'}.
              </p>
            </div>
          </div>
          {workspace.assets.length === 0 ? (
            <p className={styles.empty}>Aún no hay activos registrados.</p>
          ) : (
            <ul className={styles.list}>
              {workspace.assets.map((asset) => (
                <li key={asset.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <strong className={styles.rowTitle}>{asset.filename}</strong>
                    <span className={styles.rowMeta}>
                      {asset.mimeType} · {asset.sizeBytes} bytes · {asset.status}
                    </span>
                    <code className={styles.inlineCode}>{asset.storageKey}</code>
                  </div>
                  <AssetRowActions id={asset.id} status={asset.status} canEdit={canEdit} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {canEdit && (
          <section className={styles.section} aria-labelledby="crear-titulo">
            <h2 id="crear-titulo" className={styles.statusTitle}>
              Crear borrador
            </h2>
            <CreateDraftForm />
            <h3 className={styles.statusTitle}>Crear lanzamiento</h3>
            <CreateReleaseForm assets={workspace.assets} />
            <h3 className={styles.statusTitle}>Subir activo</h3>
            <AssetUploadForm storageConfigured={workspace.storage.configured} />
            <h3 className={styles.statusTitle}>Registrar activo</h3>
            <AssetRegistrationForm />
          </section>
        )}
      </main>
    </AdminShell>
  );
}
