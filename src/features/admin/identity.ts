import { z } from 'zod';
import { ALL_CAPABILITIES } from './permissions';
import type { AdminCapability, AdminRole as AdminRoleKey } from './permissions';

/**
 * Modelo de identidad persistente del panel — solo tipos y validación.
 * ---------------------------------------------------------------------
 * Sin acceso a base de datos. Las fechas son strings ISO en los
 * contratos: nunca `new Date()` dentro del render ni valores dinámicos
 * en módulos compartidos. Los tipos de rol y capacidad se reutilizan de
 * `permissions.ts` (no se duplican).
 */

export type AdminUserStatus = 'invited' | 'active' | 'suspended';

/** Identidad persistente mínima de un usuario del panel. */
export interface AdminUser {
  id: string;
  /** Correo normalizado (trim + lowercase). */
  email: string;
  displayName: string;
  status: AdminUserStatus;
  /** ISO 8601. */
  createdAt: string;
  /** ISO 8601. */
  updatedAt: string;
  /** ISO 8601 (opcional). */
  lastSignedInAt?: string;
  /** Referencias a claves de rol persistentes. */
  roleIds: string[];
}

/** Rol persistente. `key` reutiliza el tipo AdminRole de permissions. */
export interface AdminRole {
  id: string;
  key: AdminRoleKey;
  name: string;
  description: string;
  capabilities: AdminCapability[];
}

/** Claves de rol válidas (validadas contra el tipo existente de
 *  permissions.ts con `satisfies`; z.enum requiere literales). */
export const ADMIN_ROLE_KEYS = [
  'owner',
  'admin',
  'editor',
  'operador',
  'moderador',
  'lector',
] as const satisfies readonly AdminRoleKey[];

const ISO_DATE_SCHEMA = z.string().datetime();

const ALL_CAPABILITIES_KEYS = ALL_CAPABILITIES as [AdminCapability, ...AdminCapability[]];

export const ADMIN_USER_STATUS_SCHEMA = z.enum(['invited', 'active', 'suspended']);

export const ADMIN_ROLE_KEY_SCHEMA = z.enum(ADMIN_ROLE_KEYS);

export const ADMIN_USER_SCHEMA = z.object({
  id: z.string().min(1).max(64),
  email: z.string().trim().toLowerCase().email(),
  displayName: z.string().trim().min(1).max(120),
  status: ADMIN_USER_STATUS_SCHEMA,
  createdAt: ISO_DATE_SCHEMA,
  updatedAt: ISO_DATE_SCHEMA,
  lastSignedInAt: ISO_DATE_SCHEMA.optional(),
  roleIds: z.array(z.string().min(1).max(64)).default([]),
});

export const ADMIN_ROLE_SCHEMA = z.object({
  id: z.string().min(1).max(64),
  key: ADMIN_ROLE_KEY_SCHEMA,
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(300),
  capabilities: z.array(z.enum(ALL_CAPABILITIES_KEYS)),
});

export type AdminUserInput = z.infer<typeof ADMIN_USER_SCHEMA>;
export type AdminRoleInput = z.infer<typeof ADMIN_ROLE_SCHEMA>;
