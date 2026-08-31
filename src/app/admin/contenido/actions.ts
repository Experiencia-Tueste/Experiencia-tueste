'use server';

import { revalidatePath } from 'next/cache';

import {
  createContentDraft,
  createRelease,
  registerAsset,
  scheduleContentPublication,
  scheduleReleasePublication,
  transitionAssetStatus,
  transitionContentStatus,
  transitionReleaseStatus,
  updateContent,
} from '@/features/admin/content-service';
import { localDateTimeWithOffset } from '@/features/admin/content-schemas';
import { createSignedAssetUpload } from '@/features/admin/storage-service';
import { getCurrentAdmin } from '@/lib/auth/authorization';
import { mensajeSeguro } from './error-messages';

/**
 * Server Actions de contenido: toda mutación pasa por el servicio
 * (sesión → capacidad → Zod → auditoría). Los errores se traducen con
 * `mensajeSeguro` para no filtrar detalles internos (SQL, URL, secretos)
 * a la interfaz.
 */

/** Resultado de una acción de formulario (estado para useActionState). */
export interface ActionResult {
  ok?: boolean;
  error?: string;
}

function scheduledAtFromForm(formData: FormData): Date {
  return localDateTimeWithOffset(
    String(formData.get('scheduledAt') ?? ''),
    Number(String(formData.get('timezoneOffset') ?? '0')),
  );
}

export async function scheduleContentAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await scheduleContentPublication(String(formData.get('id') ?? ''), {
      scheduledAt: scheduledAtFromForm(formData),
      reason: String(formData.get('reason') ?? ''),
    });
    revalidateContenido();
    return { ok: true };
  } catch (error) {
    return { error: mensajeSeguro(error) };
  }
}

export async function scheduleReleaseAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await scheduleReleasePublication(String(formData.get('id') ?? ''), {
      scheduledAt: scheduledAtFromForm(formData),
      reason: String(formData.get('reason') ?? ''),
    });
    revalidateContenido();
    return { ok: true };
  } catch (error) {
    return { error: mensajeSeguro(error) };
  }
}

export interface SignedAssetUploadResult extends ActionResult {
  upload?: {
    bucket: string;
    path: string;
    token: string;
    storageKey: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    altText?: string;
  };
}

function revalidateContenido() {
  revalidatePath('/admin/contenido');
}

export async function createDraftAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const title = String(formData.get('title') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim();
  if (reason === '') {
    return { error: 'Indica una razón para la creación del borrador.' };
  }
  try {
    await createContentDraft({ title, slug, body: body || undefined }, reason);
    revalidateContenido();
    return { ok: true };
  } catch (error) {
    return { error: mensajeSeguro(error) };
  }
}

export async function sendToReviewAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return transitionAction(formData, 'review');
}

export async function publishAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return transitionAction(formData, 'published');
}

export async function archiveAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return transitionAction(formData, 'archived');
}

async function transitionAction(
  formData: FormData,
  to: 'review' | 'published' | 'archived',
): Promise<ActionResult> {
  const id = String(formData.get('id') ?? '');
  const from = String(formData.get('from') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  if (id === '' || from === '' || reason === '') {
    return { error: 'Faltan datos para la transición (id, estado actual o razón).' };
  }
  try {
    await transitionContentStatus(id, { from, to, reason });
    revalidateContenido();
    return { ok: true };
  } catch (error) {
    return { error: mensajeSeguro(error) };
  }
}

export async function sendReleaseToReviewAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return transitionReleaseAction(formData, 'review');
}

export async function publishReleaseAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return transitionReleaseAction(formData, 'published');
}

export async function archiveReleaseAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return transitionReleaseAction(formData, 'archived');
}

async function transitionReleaseAction(
  formData: FormData,
  to: 'review' | 'published' | 'archived',
): Promise<ActionResult> {
  const id = String(formData.get('id') ?? '');
  const from = String(formData.get('from') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  if (id === '' || from === '' || reason === '') {
    return { error: 'Faltan datos para la transición (id, estado actual o razón).' };
  }
  try {
    await transitionReleaseStatus(id, { from, to, reason });
    revalidateContenido();
    return { ok: true };
  } catch (error) {
    return { error: mensajeSeguro(error) };
  }
}

export async function approveAssetAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return transitionAssetAction(formData, 'approved');
}

export async function archiveAssetAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return transitionAssetAction(formData, 'archived');
}

async function transitionAssetAction(
  formData: FormData,
  to: 'approved' | 'archived',
): Promise<ActionResult> {
  const id = String(formData.get('id') ?? '');
  const from = String(formData.get('from') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  if (id === '' || from === '' || reason === '') {
    return { error: 'Faltan datos para la transición (id, estado actual o razón).' };
  }
  try {
    await transitionAssetStatus(id, { from, to, reason });
    revalidateContenido();
    return { ok: true };
  } catch (error) {
    return { error: mensajeSeguro(error) };
  }
}

export async function editContentAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get('id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim();
  if (id === '' || reason === '') {
    return { error: 'Faltan id o razón para editar.' };
  }
  try {
    await updateContent(
      id,
      {
        title: title || undefined,
        slug: slug || undefined,
        body: body || undefined,
      },
      reason,
    );
    revalidateContenido();
    return { ok: true };
  } catch (error) {
    return { error: mensajeSeguro(error) };
  }
}

function parseOptionalInteger(value: FormDataEntryValue | null): number | undefined {
  const raw = String(value ?? '').trim();
  if (raw === '') return undefined;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : Number.NaN;
}

function parseTracks(formData: FormData) {
  const titles = formData.getAll('trackTitle').map((value) => String(value).trim());
  const durations = formData.getAll('trackDuration');
  const frequencies = formData.getAll('trackHz');
  const audioAssets = formData.getAll('trackAudioAssetId');

  return titles
    .map((title, index) => ({
      title,
      durationSeconds: parseOptionalInteger(durations[index] ?? null),
      hz: parseOptionalInteger(frequencies[index] ?? null),
      audioAssetId: String(audioAssets[index] ?? '').trim() || undefined,
    }))
    .filter((track) => track.title !== '');
}

export async function createReleaseAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const title = String(formData.get('title') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const coverAssetId = String(formData.get('coverAssetId') ?? '').trim() || undefined;
  const reason = String(formData.get('reason') ?? '').trim();
  if (reason === '') {
    return { error: 'Indica una razón para la creación del lanzamiento.' };
  }
  try {
    await createRelease({ title, slug, coverAssetId, tracks: parseTracks(formData) }, reason);
    revalidateContenido();
    return { ok: true };
  } catch (error) {
    return { error: mensajeSeguro(error) };
  }
}

export async function registerAssetAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const storageKey = String(formData.get('storageKey') ?? '').trim();
  const filename = String(formData.get('filename') ?? '').trim();
  const mimeType = String(formData.get('mimeType') ?? '').trim();
  const sizeBytes = Number(String(formData.get('sizeBytes') ?? '').trim());
  const altText = String(formData.get('altText') ?? '').trim() || undefined;
  const reason = String(formData.get('reason') ?? '').trim();
  if (reason === '') {
    return { error: 'Indica una razón para registrar el activo.' };
  }
  try {
    await registerAsset({ storageKey, filename, mimeType, sizeBytes, altText }, reason);
    revalidateContenido();
    return { ok: true };
  } catch (error) {
    return { error: mensajeSeguro(error) };
  }
}

export async function prepareSignedAssetUploadAction(
  formData: FormData,
): Promise<SignedAssetUploadResult> {
  const admin = await getCurrentAdmin();
  if (admin === null) {
    return { error: '401: sesión requerida para operaciones de contenido.' };
  }
  if (!admin.capabilities.includes('content.edit')) {
    return { error: '403: se requiere la capacidad content.edit.' };
  }

  const filename = String(formData.get('filename') ?? '').trim();
  const mimeType = String(formData.get('mimeType') ?? '').trim();
  const sizeBytes = Number(String(formData.get('sizeBytes') ?? '').trim());
  const altText = String(formData.get('altText') ?? '').trim() || undefined;

  try {
    const upload = await createSignedAssetUpload({ filename, mimeType, sizeBytes, altText });
    return { ok: true, upload };
  } catch (error) {
    return { error: mensajeSeguro(error) };
  }
}

export async function completeSignedAssetUploadAction(formData: FormData): Promise<ActionResult> {
  const storageKey = String(formData.get('storageKey') ?? '').trim();
  const filename = String(formData.get('filename') ?? '').trim();
  const mimeType = String(formData.get('mimeType') ?? '').trim();
  const sizeBytes = Number(String(formData.get('sizeBytes') ?? '').trim());
  const altText = String(formData.get('altText') ?? '').trim() || undefined;
  const reason = String(formData.get('reason') ?? '').trim();
  if (reason === '') {
    return { error: 'Indica una razón para subir el activo.' };
  }
  try {
    await registerAsset({ storageKey, filename, mimeType, sizeBytes, altText }, reason);
    revalidateContenido();
    return { ok: true };
  } catch (error) {
    return { error: mensajeSeguro(error) };
  }
}
