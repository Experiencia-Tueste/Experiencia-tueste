'use client';

import { useActionState, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  approveAssetAction,
  archiveAssetAction,
  archiveAction,
  archiveReleaseAction,
  createDraftAction,
  createReleaseAction,
  editContentAction,
  completeSignedAssetUploadAction,
  prepareSignedAssetUploadAction,
  publishAction,
  publishReleaseAction,
  sendReleaseToReviewAction,
  registerAssetAction,
  sendToReviewAction,
} from './actions';
import type { ActionResult } from './actions';
import type { AssetRow, ContentRow } from '@/features/admin/content-types';
import { createClient } from '@/lib/supabase/client';
import styles from '../Admin.module.css';

/** Estado inicial de useActionState (sin mensajes). */
const initialActionState: ActionResult = {};

/**
 * Formularios de contenido (cliente): usan useActionState para mostrar
 * mensajes de error/éxito reales de las Server Actions. Las acciones
 * validan sesión, capacidad y razón en el servidor.
 */

function Feedback({ state }: { state: ActionResult }) {
  if (state.ok) {
    return <p className={styles.feedbackOk}>Operación completada.</p>;
  }
  if (state.error) {
    return <p className={styles.feedbackError}>{state.error}</p>;
  }
  return null;
}

function TransitionForm({
  id,
  from,
  action,
  label,
  kind,
}: {
  id: string;
  from: string;
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  label: string;
  kind: 'primary' | 'ghost';
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  return (
    <form action={formAction} className={styles.rowForm}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="from" value={from} />
      {/* La razón es aportada explícitamente por el usuario (obligatoria). */}
      <input
        name="reason"
        className={styles.reasonInput}
        placeholder={`Razón para ${label.toLowerCase()}`}
        required
        minLength={3}
        maxLength={300}
      />
      <button type="submit" className={kind === 'primary' ? styles.button : styles.buttonGhost}>
        {label}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function ContentRowActions({
  row,
  canEdit,
  canPublish,
}: {
  row: ContentRow;
  /** ¿Puede editar/preparar/archivar contenido? */
  canEdit: boolean;
  /** ¿Puede publicar? (content.publish) */
  canPublish: boolean;
}) {
  return (
    <div className={styles.rowActions}>
      {canEdit && row.status !== 'archived' && <EditContentForm row={row} />}
      {row.status === 'draft' && canEdit && (
        <TransitionForm
          id={row.id}
          from="draft"
          action={sendToReviewAction}
          label="Enviar a revisión"
          kind="ghost"
        />
      )}
      {row.status === 'review' && canPublish && (
        <TransitionForm
          id={row.id}
          from="review"
          action={publishAction}
          label="Publicar"
          kind="primary"
        />
      )}
      {(row.status === 'published' || row.status === 'review') && canEdit && (
        <TransitionForm
          id={row.id}
          from={row.status}
          action={archiveAction}
          label="Archivar"
          kind="ghost"
        />
      )}
    </div>
  );
}

export function ReleaseRowActions({
  id,
  status,
  canEdit,
  canPublish,
}: {
  id: string;
  status: ContentRow['status'];
  canEdit: boolean;
  canPublish: boolean;
}) {
  return (
    <div className={styles.rowActions}>
      {status === 'draft' && canEdit && (
        <TransitionForm
          id={id}
          from="draft"
          action={sendReleaseToReviewAction}
          label="Enviar a revisión"
          kind="ghost"
        />
      )}
      {status === 'review' && canPublish && (
        <TransitionForm
          id={id}
          from="review"
          action={publishReleaseAction}
          label="Publicar"
          kind="primary"
        />
      )}
      {(status === 'published' || status === 'review') && canEdit && (
        <TransitionForm
          id={id}
          from={status}
          action={archiveReleaseAction}
          label="Archivar"
          kind="ghost"
        />
      )}
    </div>
  );
}

export function AssetRowActions({
  id,
  status,
  canEdit,
}: {
  id: string;
  status: AssetRow['status'];
  canEdit: boolean;
}) {
  if (!canEdit || status === 'archived') return null;
  return (
    <div className={styles.rowActions}>
      {status === 'pending' && (
        <TransitionForm
          id={id}
          from="pending"
          action={approveAssetAction}
          label="Aprobar"
          kind="primary"
        />
      )}
      <TransitionForm
        id={id}
        from={status}
        action={archiveAssetAction}
        label="Archivar"
        kind="ghost"
      />
    </div>
  );
}

export function EditContentForm({ row }: { row: ContentRow }) {
  const [state, formAction] = useActionState(editContentAction, initialActionState);
  return (
    <form action={formAction} className={styles.inlineForm}>
      <input type="hidden" name="id" value={row.id} />
      <label className={styles.label}>
        Título
        <input
          name="title"
          className={styles.reasonInput}
          defaultValue={row.title}
          maxLength={200}
        />
      </label>
      <label className={styles.label}>
        Slug
        <input
          name="slug"
          className={styles.reasonInput}
          defaultValue={row.slug}
          pattern="[a-z0-9-]+"
        />
      </label>
      <label className={styles.label}>
        Cuerpo
        <textarea name="body" className={styles.textareaSmall} defaultValue={row.body ?? ''} />
      </label>
      <label className={styles.label}>
        Razón
        <input
          name="reason"
          className={styles.reasonInput}
          required
          minLength={3}
          maxLength={300}
        />
      </label>
      <button type="submit" className={styles.buttonGhost}>
        Guardar
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function CreateDraftForm() {
  const [state, formAction] = useActionState(createDraftAction, initialActionState);
  return (
    <form action={formAction} className={styles.form}>
      <label className={styles.label}>
        Título
        <input name="title" className={styles.input} required maxLength={200} />
      </label>
      <label className={styles.label}>
        Slug
        <input name="slug" className={styles.input} required pattern="[a-z0-9-]+" />
      </label>
      <label className={styles.label}>
        Cuerpo
        <textarea name="body" className={styles.textarea} maxLength={50000} />
      </label>
      <label className={styles.label}>
        Razón
        <input name="reason" className={styles.input} required minLength={3} maxLength={300} />
      </label>
      <button type="submit" className={styles.button}>
        Crear borrador
      </button>
      <Feedback state={state} />
    </form>
  );
}

function AssetSelect({
  name,
  label,
  assets,
  acceptedMimePrefix,
}: {
  name: string;
  label: string;
  assets: AssetRow[];
  acceptedMimePrefix?: string;
}) {
  const options = acceptedMimePrefix
    ? assets.filter((asset) => asset.mimeType.startsWith(acceptedMimePrefix))
    : assets;
  return (
    <label className={styles.label}>
      {label}
      <select name={name} className={styles.input} defaultValue="">
        <option value="">Sin activo</option>
        {options.map((asset) => (
          <option key={asset.id} value={asset.id}>
            {asset.filename}
          </option>
        ))}
      </select>
    </label>
  );
}

function TrackFields({ index, assets }: { index: number; assets: AssetRow[] }) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Pista {index + 1}</legend>
      <label className={styles.label}>
        Título
        <input name="trackTitle" className={styles.input} maxLength={200} />
      </label>
      <div className={styles.formGrid}>
        <label className={styles.label}>
          Duración en segundos
          <input
            name="trackDuration"
            className={styles.input}
            inputMode="numeric"
            pattern="[0-9]*"
          />
        </label>
        <label className={styles.label}>
          Frecuencia Hz
          <input name="trackHz" className={styles.input} inputMode="numeric" pattern="[0-9]*" />
        </label>
      </div>
      <AssetSelect
        name="trackAudioAssetId"
        label="Audio"
        assets={assets}
        acceptedMimePrefix="audio/"
      />
    </fieldset>
  );
}

export function CreateReleaseForm({ assets }: { assets: AssetRow[] }) {
  const [state, formAction] = useActionState(createReleaseAction, initialActionState);
  return (
    <form action={formAction} className={styles.form}>
      <label className={styles.label}>
        Título
        <input name="title" className={styles.input} required maxLength={200} />
      </label>
      <label className={styles.label}>
        Slug
        <input name="slug" className={styles.input} required pattern="[a-z0-9-]+" />
      </label>
      <AssetSelect
        name="coverAssetId"
        label="Portada"
        assets={assets}
        acceptedMimePrefix="image/"
      />
      <div className={styles.fieldGroup}>
        <p className={styles.fieldHint}>Pistas opcionales</p>
        {[0, 1, 2].map((index) => (
          <TrackFields key={index} index={index} assets={assets} />
        ))}
      </div>
      <label className={styles.label}>
        Razón
        <input name="reason" className={styles.input} required minLength={3} maxLength={300} />
      </label>
      <button type="submit" className={styles.button}>
        Crear lanzamiento
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function AssetRegistrationForm() {
  const [state, formAction] = useActionState(registerAssetAction, initialActionState);
  return (
    <form action={formAction} className={styles.form}>
      <label className={styles.label}>
        Clave Storage
        <input
          name="storageKey"
          className={styles.input}
          required
          maxLength={500}
          placeholder="tueste-admin-assets/carpeta/archivo.webp"
        />
      </label>
      <label className={styles.label}>
        Nombre de archivo
        <input name="filename" className={styles.input} required maxLength={255} />
      </label>
      <div className={styles.formGrid}>
        <label className={styles.label}>
          MIME type
          <input name="mimeType" className={styles.input} required placeholder="image/webp" />
        </label>
        <label className={styles.label}>
          Tamaño bytes
          <input
            name="sizeBytes"
            className={styles.input}
            required
            inputMode="numeric"
            pattern="[0-9]+"
          />
        </label>
      </div>
      <label className={styles.label}>
        Texto alternativo
        <input name="altText" className={styles.input} maxLength={500} />
      </label>
      <label className={styles.label}>
        Razón
        <input name="reason" className={styles.input} required minLength={3} maxLength={300} />
      </label>
      <button type="submit" className={styles.button}>
        Registrar activo
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function AssetUploadForm({ storageConfigured }: { storageConfigured: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<ActionResult>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setState({});

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('file');
    const reason = String(formData.get('reason') ?? '').trim();

    if (!(file instanceof File) || file.size === 0) {
      setState({ error: 'Selecciona un archivo para subir.' });
      setPending(false);
      return;
    }
    if (reason.length < 3) {
      setState({ error: 'Indica una razón de al menos 3 caracteres.' });
      setPending(false);
      return;
    }

    const uploadRequest = new FormData();
    uploadRequest.set('filename', file.name);
    uploadRequest.set('mimeType', file.type || 'application/octet-stream');
    uploadRequest.set('sizeBytes', String(file.size));
    uploadRequest.set('altText', String(formData.get('altText') ?? '').trim());

    const prepared = await prepareSignedAssetUploadAction(uploadRequest);
    if (!prepared.ok || !prepared.upload) {
      setState({ error: prepared.error ?? 'No se pudo preparar la subida.' });
      setPending(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setState({ error: 'Falta la configuración pública de Supabase para subir el archivo.' });
      setPending(false);
      return;
    }

    const { error: uploadError } = await supabase.storage
      .from(prepared.upload.bucket)
      .uploadToSignedUrl(prepared.upload.path, prepared.upload.token, file, {
        contentType: prepared.upload.mimeType,
      });

    if (uploadError) {
      setState({ error: 'No se pudo subir el archivo a Storage.' });
      setPending(false);
      return;
    }

    const completeRequest = new FormData();
    completeRequest.set('storageKey', prepared.upload.storageKey);
    completeRequest.set('filename', prepared.upload.filename);
    completeRequest.set('mimeType', prepared.upload.mimeType);
    completeRequest.set('sizeBytes', String(prepared.upload.sizeBytes));
    completeRequest.set('altText', prepared.upload.altText ?? '');
    completeRequest.set('reason', reason);

    const completed = await completeSignedAssetUploadAction(completeRequest);
    setState(completed);
    setPending(false);
    if (completed.ok) {
      form.reset();
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label className={styles.label}>
        Archivo
        <input
          name="file"
          type="file"
          className={styles.input}
          accept="image/*,audio/*,video/*,application/pdf"
          disabled={!storageConfigured || pending}
          required
        />
      </label>
      <label className={styles.label}>
        Texto alternativo
        <input name="altText" className={styles.input} maxLength={500} disabled={pending} />
      </label>
      <label className={styles.label}>
        Razón
        <input
          name="reason"
          className={styles.input}
          required
          minLength={3}
          maxLength={300}
          disabled={pending}
        />
      </label>
      {!storageConfigured ? (
        <p className={styles.feedbackError}>
          Storage todavía no está configurado en el entorno privado.
        </p>
      ) : null}
      <button type="submit" className={styles.button} disabled={!storageConfigured || pending}>
        {pending ? 'Subiendo…' : 'Subir activo'}
      </button>
      <Feedback state={state} />
    </form>
  );
}
