import { z } from 'zod';

/**
 * Contratos de contenido y activos del panel — validación pura (Zod).
 * ---------------------------------------------------------------------
 * Estados, transiciones y esquemas de entrada para contenido,
 * lanzamientos, pistas y activos. Sin red ni persistencia.
 */

export const CONTENT_STATUS = ['draft', 'review', 'published', 'archived'] as const;
export type ContentStatus = (typeof CONTENT_STATUS)[number];

export const ASSET_STATUS = ['pending', 'approved', 'archived'] as const;
export type AssetStatus = (typeof ASSET_STATUS)[number];

export const CONTENT_STATUS_SCHEMA = z.enum(CONTENT_STATUS);
export const ASSET_STATUS_SCHEMA = z.enum(ASSET_STATUS);

/** Transiciones permitidas de contenido. */
export const CONTENT_STATUS_FLOW: ReadonlyArray<readonly [ContentStatus, ContentStatus]> = [
  ['draft', 'review'],
  ['review', 'published'],
  ['review', 'draft'],
  ['published', 'archived'],
  ['draft', 'archived'],
];

/** Transiciones permitidas de activos. */
export const ASSET_STATUS_FLOW: ReadonlyArray<readonly [AssetStatus, AssetStatus]> = [
  ['pending', 'approved'],
  ['pending', 'archived'],
  ['approved', 'archived'],
];

export function canTransitionContent(from: ContentStatus, to: ContentStatus): boolean {
  return CONTENT_STATUS_FLOW.some(([a, b]) => a === from && b === to);
}

export function canTransitionAsset(from: AssetStatus, to: AssetStatus): boolean {
  return ASSET_STATUS_FLOW.some(([a, b]) => a === from && b === to);
}

const UUID_SCHEMA = z.string().uuid();
const SLUG_SCHEMA = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => value.replace(/[–—]/g, '-').replace(/\s+/g, '-'))
  .pipe(
    z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9-]+$/, 'el slug solo admite minúsculas, números y guiones'),
  );

/** Creación de un borrador de contenido. */
export const CONTENT_DRAFT_SCHEMA = z.object({
  title: z.string().trim().min(1).max(200),
  slug: SLUG_SCHEMA,
  body: z.string().max(50000).optional(),
});

/** Edición de contenido (parcial). */
export const CONTENT_UPDATE_SCHEMA = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  slug: SLUG_SCHEMA.optional(),
  body: z.string().max(50000).optional(),
});

/** Transición de estado con razón obligatoria (cambios sensibles). */
export const STATUS_TRANSITION_SCHEMA = z.object({
  from: CONTENT_STATUS_SCHEMA,
  to: CONTENT_STATUS_SCHEMA,
  reason: z.string().trim().min(3).max(300),
});

export const ASSET_STATUS_TRANSITION_SCHEMA = z.object({
  from: ASSET_STATUS_SCHEMA,
  to: ASSET_STATUS_SCHEMA,
  reason: z.string().trim().min(3).max(300),
});

export const SCHEDULE_SCHEMA = z.object({
  scheduledAt: z.coerce
    .date()
    .refine((value) => value.getTime() > Date.now(), 'La fecha debe estar en el futuro.'),
  reason: z.string().trim().min(3).max(300),
});

const LOCAL_DATE_TIME_SCHEMA = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Fecha local inválida.');

/** Convierte el datetime-local del navegador a un instante UTC inequívoco. */
export function localDateTimeWithOffset(value: string, timezoneOffset: number): Date {
  const local = LOCAL_DATE_TIME_SCHEMA.parse(value);
  const offset = z.number().int().min(-840).max(840).parse(timezoneOffset);
  const localInterpretedAsUtc = Date.parse(`${local}:00.000Z`);
  return new Date(localInterpretedAsUtc + offset * 60_000);
}

/** Creación de un lanzamiento con sus pistas. */
export const RELEASE_SCHEMA = z.object({
  title: z.string().trim().min(1).max(200),
  slug: SLUG_SCHEMA,
  coverAssetId: UUID_SCHEMA.optional(),
  tracks: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(200),
        durationSeconds: z.number().int().positive().optional(),
        hz: z.number().int().positive().optional(),
        audioAssetId: UUID_SCHEMA.optional(),
      }),
    )
    .max(50)
    .default([]),
});

/** Registro de un activo (metadatos; sin subida real aún). */
export const ASSET_SCHEMA = z.object({
  storageKey: z.string().trim().min(1).max(500),
  filename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(120),
  sizeBytes: z.number().int().nonnegative(),
  altText: z.string().trim().max(500).optional(),
  status: ASSET_STATUS_SCHEMA.default('pending'),
});

/** Registro manual de activo desde el panel. */
export const ASSET_REGISTRATION_SCHEMA = ASSET_SCHEMA.omit({ status: true });

const ALLOWED_ASSET_MIME_PREFIXES = ['image/', 'audio/', 'video/'] as const;
const ALLOWED_ASSET_MIME_TYPES = ['application/pdf'] as const;

export const ASSET_UPLOAD_REQUEST_SCHEMA = z.object({
  filename: z.string().trim().min(1).max(255),
  mimeType: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .refine(
      (value) =>
        ALLOWED_ASSET_MIME_PREFIXES.some((prefix) => value.startsWith(prefix)) ||
        ALLOWED_ASSET_MIME_TYPES.includes(value as (typeof ALLOWED_ASSET_MIME_TYPES)[number]),
      'tipo de archivo no permitido',
    ),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(25 * 1024 * 1024),
  altText: z.string().trim().max(500).optional(),
});

export type ContentDraftInput = z.infer<typeof CONTENT_DRAFT_SCHEMA>;
export type ContentUpdateInput = z.infer<typeof CONTENT_UPDATE_SCHEMA>;
export type StatusTransitionInput = z.infer<typeof STATUS_TRANSITION_SCHEMA>;
export type AssetStatusTransitionInput = z.infer<typeof ASSET_STATUS_TRANSITION_SCHEMA>;
export type ReleaseInput = z.infer<typeof RELEASE_SCHEMA>;
export type AssetInput = z.infer<typeof ASSET_SCHEMA>;
export type AssetRegistrationInput = z.infer<typeof ASSET_REGISTRATION_SCHEMA>;
export type AssetUploadRequestInput = z.infer<typeof ASSET_UPLOAD_REQUEST_SCHEMA>;
