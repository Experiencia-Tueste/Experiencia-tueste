import { z } from 'zod';

/** Códigos del servicio cuyo mensaje es seguro y útil para la interfaz. */
const CONTROLLED_ERROR_CODES = new Set(['400', '401', '403', '404', '409']);

const GENERIC_ERROR_MESSAGE = 'No se pudo completar la operación. Intenta nuevamente.';

/** Detecta la violación de unicidad de PostgreSQL (slug duplicado). */
function esSlugDuplicado(error: unknown): boolean {
  if (error !== null && typeof error === 'object' && 'code' in error) {
    return (error as { code?: unknown }).code === '23505';
  }
  return false;
}

function mensajeStorageSeguro(error: unknown): string | null {
  if (error === null || typeof error !== 'object') return null;
  const storageError = error as {
    name?: unknown;
    status?: unknown;
    statusCode?: unknown;
    code?: unknown;
    message?: unknown;
  };
  if (storageError.name !== 'StorageApiError') return null;

  const status = typeof storageError.status === 'number' ? storageError.status : undefined;
  const statusCode =
    typeof storageError.statusCode === 'string' ? storageError.statusCode : undefined;
  const code = typeof storageError.code === 'string' ? storageError.code : undefined;
  const message = typeof storageError.message === 'string' ? storageError.message : '';

  if (status === 404 || code === 'NoSuchBucket' || /bucket/i.test(message)) {
    return 'Storage no encontró el bucket. Revisa que exista un bucket privado llamado tueste-admin-assets y que SUPABASE_STORAGE_BUCKET tenga exactamente ese nombre.';
  }
  if (status === 401 || status === 403 || code === 'AccessDenied') {
    return 'Storage rechazó la autorización. Revisa que SUPABASE_STORAGE_ADMIN_KEY sea una key privada sb_secret_ completa del mismo proyecto.';
  }
  if (status === 409 || code === 'ResourceAlreadyExists') {
    return 'Ese archivo ya existe en Storage. Intenta nuevamente para generar una clave nueva.';
  }
  if (statusCode !== undefined) {
    return `Storage rechazó la operación (${statusCode}). Revisa bucket, URL y key privada del proyecto.`;
  }
  return 'Storage rechazó la operación. Revisa bucket, URL y key privada del proyecto.';
}

/**
 * Traduce cualquier error a un mensaje seguro para el usuario:
 * - Zod: mensajes claros por campo.
 * - Solo conserva mensajes de los códigos controlados del servicio.
 * - Slug duplicado: mensaje amigable.
 * - Cualquier otro error: marcador seguro en servidor y mensaje genérico.
 */
export function mensajeSeguro(error: unknown): string {
  if (error instanceof z.ZodError) {
    const issues = error.issues;
    if (issues.some((issue) => String(issue.path[0]) === 'slug')) {
      return 'Slug inválido: usa solo minúsculas, números y guiones (p. ej. lanzamiento-tueste-2026).';
    }
    if (issues.some((issue) => String(issue.path[0]) === 'title')) {
      return 'El título es obligatorio (máximo 200 caracteres).';
    }
    if (issues.some((issue) => String(issue.path[0]) === 'tracks')) {
      return 'Revisa las pistas: cada pista necesita título, y duración/frecuencia deben ser números positivos.';
    }
    if (issues.some((issue) => String(issue.path[0]) === 'sizeBytes')) {
      return 'El tamaño del activo debe ser un número válido en bytes.';
    }
    if (issues.some((issue) => String(issue.path[0]) === 'mimeType')) {
      return 'El MIME type es obligatorio (por ejemplo image/webp o audio/mpeg).';
    }
    if (issues.some((issue) => String(issue.path[0]) === 'storageKey')) {
      return 'La clave de Storage es obligatoria (por ejemplo bucket/carpeta/archivo.webp).';
    }
    return `Datos inválidos: ${issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(' · ')}`;
  }

  const message = error instanceof Error ? error.message : '';
  const code = message.match(/^(\d{3}): /)?.[1];
  if (code !== undefined && CONTROLLED_ERROR_CODES.has(code)) {
    return message;
  }

  if (esSlugDuplicado(error)) {
    return 'Ya existe un elemento con ese slug. Elige otro.';
  }

  const storageMessage = mensajeStorageSeguro(error);
  if (storageMessage !== null) {
    return storageMessage;
  }

  console.error(
    '[admin-contenido] error inesperado en Server Action.',
    error instanceof Error ? error.name : 'unknown',
  );
  return GENERIC_ERROR_MESSAGE;
}
