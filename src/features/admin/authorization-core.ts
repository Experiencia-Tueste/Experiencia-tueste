import type { AdminUser } from './identity';
import type { AdminRole, AdminRoleKey } from './identity';
import type { AdminCapability } from './permissions';

/**
 * Núcleo de autorización — lógica PURA y testeable, sin Auth.js, sin
 * next/navigation, sin base de datos. `authorization.ts` (server-only)
 * la consume junto con `auth()` de Auth.js y el repositorio persistente.
 *
 * Desde la Fase 1.2 el acceso NO depende de una allowlist: depende del
 * usuario persistente (estado `active`) y de sus roles persistidos.
 */

/** Administrador autenticado con sus roles persistidos. */
export interface CurrentAdmin {
  /** UUID del usuario persistido (admin_users.id). */
  id: string;
  email: string;
  name: string | null;
  /**
   * Rol de mayor jerarquía (para UI y contexto), si hay varios.
   * Las capacidades efectivas son la UNIÓN de todos los roles.
   */
  role: AdminRoleKey;
  /** Capacidades combinadas de todos los roles del usuario. */
  capabilities: AdminCapability[];
}

/** Orden de jerarquía de roles (mayor primero) para el rol visible. */
const ROLE_PRIORITY: readonly AdminRoleKey[] = [
  'owner',
  'admin',
  'editor',
  'operador',
  'moderador',
  'lector',
];

/** Capacidades efectivas por clave de rol (fuente única). */
import { ROLE_CAPABILITIES } from './permissions';

/**
 * Decide el administrador a partir del usuario persistente y sus roles.
 *
 * Reglas (fail closed):
 * - usuario inexistente → null;
 * - usuario no `active` (invitado/suspendido) → null;
 * - sin roles persistidos → null.
 *
 * Multi-rol: si el usuario tiene varios roles, `role` muestra el de mayor
 * jerarquía y `capabilities` es la UNIÓN de las capacidades de todos los
 * roles (no se descarta ningún rol secundario).
 */
export function resolvePersistedAdmin(
  user: AdminUser | null,
  roles: AdminRole[],
): CurrentAdmin | null {
  if (user === null) return null;
  if (user.status !== 'active') return null;
  if (roles.length === 0) return null;

  const role = ROLE_PRIORITY.find((candidate) => roles.some((r) => r.key === candidate));
  if (role === undefined) return null;

  const capabilities = Array.from(new Set(roles.flatMap((r) => ROLE_CAPABILITIES[r.key] ?? [])));

  return { id: user.id, email: user.email, name: user.displayName ?? null, role, capabilities };
}
