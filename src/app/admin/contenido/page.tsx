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

/** Formatea bytes a una unidad legible (p. ej. «1,2 MB»). */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = units[0];
  for (let i = 1; i < units.length && value >= 1024; i += 1) {
    value /= 1024;
    unit = units[i];
  }
  return `${value.toLocaleString('es-AR', { maximumFractionDigits: 1 })} ${unit}`;
}

/**
 * /admin/contenido — gestión editorial de contenido (Fase 3).
 *
 * Protegida con requireCapability('content.read'). El listado y las
 * acciones disponibles dependen de las capacidades del usuario
 * (content.read / content.edit / content.publish). Sin datos demo:
 * los estados vacíos y los errores son reales.
 *
 * Orden pensado para uso real: la Biblioteca de activos va primero
 * (previews con URLs firmadas, subida cerca, registro manual bajo
 * «Avanzado»), luego Lanzamientos (solo activos aprobados) y por
 * último las Entradas editoriales.
 */
export default async function AdminContentPage() {
  const admin = await requireCapability('content.read');
  const canEdit = admin.capabilities.includes('content.edit');
  const canPublish = admin.capabilities.includes('content.publish');
  const workspace = await getContentWorkspace(admin);

  // Crear lanzamiento solo con activos aprobados (el servidor sigue
  // validando; aquí solo se reduce lo que el usuario puede elegir).
  const approvedAssets = workspace.assets.filter((asset) => asset.status === 'approved');

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

        <section className={styles.section} aria-labelledby="assets-titulo">
          <div className={styles.sectionHeader}>
            <div>
              <h2 id="assets-titulo" className={styles.statusTitle}>
                Biblioteca de activos
              </h2>
              <p className={styles.empty}>
                Storage {workspace.storage.configured ? 'configurado' : 'pendiente de configurar'}.
                Sube y aprueba activos antes de usarlos.
              </p>
            </div>
          </div>

          {workspace.assets.length === 0 ? (
            <p className={styles.empty}>Aún no hay activos registrados.</p>
          ) : (
            <ul className={styles.assetGrid}>
              {workspace.assets.map((asset) => (
                <li key={asset.id} className={styles.assetCard}>
                  <div className={styles.assetPreviewWrap}>
                    {asset.previewUrl ? (
                      // URL firmada temporal de Storage (expira): next/image
                      // la optimizaría y exigiría remotePatterns por dominio
                      // desconocido; el preview se usa tal cual.
                      // eslint-disable-next-line @next/next/no-img-element -- preview con URL firmada dinámica
                      <img
                        className={styles.assetPreview}
                        src={asset.previewUrl}
                        alt={asset.altText ?? asset.filename}
                        loading="lazy"
                      />
                    ) : (
                      <span className={styles.assetPreviewPlaceholder}>sin preview</span>
                    )}
                  </div>
                  <div className={styles.assetInfo}>
                    <strong className={styles.rowTitle}>{asset.filename}</strong>
                    <span className={styles.rowMeta}>
                      {asset.mimeType} · {formatBytes(asset.sizeBytes)} · {asset.status}
                    </span>
                    <code className={styles.assetStorageKey}>{asset.storageKey}</code>
                  </div>
                  <AssetRowActions id={asset.id} status={asset.status} canEdit={canEdit} />
                </li>
              ))}
            </ul>
          )}

          {canEdit && (
            <div className={styles.fieldGroup}>
              <h3 className={styles.statusTitle}>Añadir activo</h3>
              <AssetUploadForm storageConfigured={workspace.storage.configured} />
              <details className={styles.advancedDetails}>
                <summary className={styles.advancedSummary}>
                  Avanzado: registrar activo manualmente
                </summary>
                <AssetRegistrationForm />
              </details>
            </div>
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

          {canEdit && (
            <div className={styles.fieldGroup}>
              <h3 className={styles.statusTitle}>Crear lanzamiento</h3>
              {approvedAssets.length === 0 ? (
                <p className={styles.empty}>
                  No hay activos aprobados para usar en un lanzamiento: sube y aprueba activos antes
                  de usarlos.
                </p>
              ) : null}
              <CreateReleaseForm assets={approvedAssets} />
            </div>
          )}
        </section>

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

          {canEdit && (
            <div className={styles.fieldGroup}>
              <h3 className={styles.statusTitle}>Crear borrador</h3>
              <CreateDraftForm />
            </div>
          )}
        </section>
      </main>
    </AdminShell>
  );
}
