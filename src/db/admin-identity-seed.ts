import { ADMIN_ROLES_META } from './admin-roles.mjs';
import { ROLE_CAPABILITIES } from '@/features/admin/permissions';
import type { AdminCapability, AdminRole } from '@/features/admin/permissions';

/**
 * Datos puros de los seis roles del panel — sin persistencia.
 * ---------------------------------------------------------------------
 * Nombres y descripciones provienen de `admin-roles.mjs` (fuente única,
 * compartida con el bootstrap); las capacidades se derivan de
 * `permissions.ts`. Las claves se validan en runtime contra el contrato:
 * los únicos casts restantes (`Object.keys(...) as AdminRole[]` y el
 * retorno de `assertRoleKey`) son **casts controlados que se ejecutan
 * después de validar la clave**: la comprobación lanza si la clave es
 * desconocida, por lo que no pueden ocultar un error de tipeo. No se
 * generan UUIDs ni fechas durante la importación.
 */

/** Valida que una clave de rol provenga de admin-roles.mjs sea conocida. */
export function assertRoleKey(key: string): AdminRole {
  const keys = Object.keys(ROLE_CAPABILITIES) as AdminRole[];
  if (!keys.includes(key as AdminRole)) {
    throw new Error(`Clave de rol desconocida en admin-roles.mjs: «${key}».`);
  }
  return key as AdminRole;
}

export interface AdminRoleSeed {
  key: AdminRole;
  name: string;
  description: string;
  capabilities: AdminCapability[];
}

export const ADMIN_ROLES_SEED: readonly AdminRoleSeed[] = ADMIN_ROLES_META.map((meta) => {
  const key = assertRoleKey(meta.key);
  return {
    key,
    name: meta.name,
    description: meta.description,
    capabilities: [...ROLE_CAPABILITIES[key]],
  };
});
