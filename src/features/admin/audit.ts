import { z } from 'zod';

/**
 * Auditoría inmutable del panel — contrato puro.
 * ---------------------------------------------------------------------
 * Solo tipos y validación de metadata. No almacena logs, no genera ids
 * aleatorios, no usa Date.now() ni Math.random(): `occurredAt` e `id`
 * los provee la capa de persistencia (repositorio Drizzle).
 */

/** Acciones administrativas auditables (identidad + contenido Fase 2). */
export const AUDIT_ACTIONS = [
  'user.invited',
  'user.activated',
  'user.suspended',
  'role.assigned',
  'role.revoked',
  'auth.sign_in',
  'auth.sign_out',
  'content.created',
  'content.updated',
  'content.reviewed',
  'content.published',
  'content.archived',
  'release.created',
  'release.reviewed',
  'release.published',
  'release.archived',
  'asset.created',
  'asset.approved',
  'asset.archived',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** Acciones de contenido: tipo derivado de AuditAction (solo en tiempo
 *  de compilación; sin lista runtime duplicada). Extract garantiza que
 *  cada literal es una AuditAction válida: no puede desalinearse. */
export type ContentAuditAction = Extract<
  AuditAction,
  | 'content.created'
  | 'content.updated'
  | 'content.reviewed'
  | 'content.published'
  | 'content.archived'
  | 'release.created'
  | 'release.reviewed'
  | 'release.published'
  | 'release.archived'
  | 'asset.created'
  | 'asset.approved'
  | 'asset.archived'
>;

/** Entrada de auditoría inmutable. */
export interface AuditLogEntry {
  id: string;
  actorUserId: string;
  /** Snapshot del correo del actor (opcional; nunca null si se conoce). */
  actorEmail?: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  /** ISO 8601 (inyectada por la persistencia). */
  occurredAt: string;
  /**
   * Razón obligatoria de la mutación (trim, 3–300 caracteres). La capa
   * que produzca la auditoría la provee explícitamente; nunca se fabrica
   * en runtime.
   */
  reason: string;
  /** Metadata segura y serializable (validada estructuralmente). */
  metadata: Record<string, unknown>;
}

/** Claves de metadata que jamás se aceptan (case-insensitive). */
const SENSITIVE_KEYS = [
  'password',
  'secret',
  'token',
  'authorization',
  'clientsecret',
  'accesstoken',
  'refreshtoken',
];

/** ¿Es un objeto plano (prototipo Object.prototype o null)? */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Validación ESTRUCTURAL estricta de un valor de metadata: acepta solo
 * null, strings, booleanos, números finitos, arrays de valores válidos
 * y objetos planos (sin claves sensibles ni propiedades Symbol).
 *
 * Rechaza: undefined, funciones, símbolos, bigint, NaN, ±Infinity,
 * Date, Map, Set, RegExp, instancias de clase, prototipos no planos y
 * estructuras CIRCULARES (sin lanzar recursión infinita).
 *
 * `ancestors` es un WeakSet LOCAL por llamada de validación que
 * representa solo la cadena de ancestros actual: se añade la referencia
 * antes de recorrer sus hijos y se remueve al terminar esa rama (incluso
 * si el hijo es inválido), de modo que una misma referencia compartida
 * en dos ramas independientes sigue siendo válida.
 */
function isValidMetadataValue(value: unknown, ancestors: WeakSet<object>): boolean {
  if (value === null) return true;

  const type = typeof value;
  if (type === 'string' || type === 'boolean') return true;
  if (type === 'number') return Number.isFinite(value);
  // undefined, function, symbol, bigint: no aceptados.
  if (type !== 'object') return false;

  if (Array.isArray(value)) {
    // Propiedades Symbol propias: no son serializables en JSON.
    if (Object.getOwnPropertySymbols(value).length > 0) return false;
    if (ancestors.has(value)) return false; // ciclo
    ancestors.add(value);
    try {
      return value.every((item) => isValidMetadataValue(item, ancestors));
    } finally {
      ancestors.delete(value);
    }
  }

  // Date, Map, Set, RegExp e instancias de clase tienen prototipos no
  // planos: quedan fuera.
  if (!isPlainObject(value)) return false;

  // Propiedades Symbol propias: rechazadas.
  if (Object.getOwnPropertySymbols(value).length > 0) return false;
  if (ancestors.has(value)) return false; // ciclo
  ancestors.add(value);
  try {
    for (const key of Object.keys(value)) {
      if (SENSITIVE_KEYS.includes(key.toLowerCase())) return false;
      if (!isValidMetadataValue(value[key], ancestors)) return false;
    }
    return true;
  } finally {
    ancestors.delete(value);
  }
}

export const AUDIT_ENTRY_SCHEMA = z.object({
  id: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorEmail: z.string().trim().toLowerCase().email().optional(),
  action: z.enum(AUDIT_ACTIONS),
  targetType: z.string().trim().min(1).max(80),
  targetId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  reason: z
    .string()
    .trim()
    .min(3, 'La razón de la mutación es obligatoria (mínimo 3 caracteres).')
    .max(300, 'La razón no puede superar 300 caracteres.'),
  metadata: z.record(z.string(), z.unknown()),
});

/**
 * Valida la metadata de una entrada de auditoría: objetos planos con
 * valores estrictamente JSON-seguros, sin claves sensibles (raíz o
 * anidadas), sin propiedades Symbol y sin estructuras circulares. No
 * usa JSON.stringify como mecanismo de detección: la validación es
 * estructural, con un WeakSet local de ancestros por llamada.
 */
export function validateAuditMetadata(value: unknown): value is Record<string, unknown> {
  if (!isPlainObject(value)) return false;
  const ancestors = new WeakSet<object>();
  return isValidMetadataValue(value, ancestors);
}

/**
 * Valida una razón de auditoría (además del schema): rechaza cadenas
 * que embeban deliberadamente secretos o tokens (clave sensible + '=').
 */
export function isSafeReason(reason: string): boolean {
  return !/(password|secret|token|authorization|clientsecret|accesstoken|refreshtoken)\s*=/i.test(
    reason,
  );
}

/** Parsea y valida una entrada de auditoría completa (pura). */
export function parseAuditEntry(value: unknown): AuditLogEntry {
  const parsed = AUDIT_ENTRY_SCHEMA.parse(value);
  if (!validateAuditMetadata(parsed.metadata)) {
    throw new Error('AuditLogEntry: metadata no serializable o con campos sensibles.');
  }
  if (!isSafeReason(parsed.reason)) {
    throw new Error('AuditLogEntry: la razón no puede contener secretos o tokens.');
  }
  return parsed;
}
