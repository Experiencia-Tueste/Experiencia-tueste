/**
 * Roles y capacidades del panel administrativo — lógica pura.
 * ---------------------------------------------------------------------
 * Sin React, sin red, sin persistencia: define el mapa explícito
 * rol → capacidades y la función `hasCapability`. Los permisos se
 * validan en servidor por capacidad, nunca solo ocultando botones en
 * cliente.
 */

import { ADMIN_CAPABILITIES, ADMIN_ROLES_META } from '@/db/admin-roles.mjs';

export type AdminRole =
  'owner' | 'admin' | 'editor' | 'operador' | 'moderador' | 'lector' | 'vendedor';

export type AdminCapability =
  | 'admin.access'
  | 'users.manage'
  | 'content.read'
  | 'content.edit'
  | 'content.review'
  | 'content.publish'
  | 'crm.read'
  | 'crm.manage'
  | 'crm.export'
  | 'orders.read'
  | 'orders.manage'
  | 'orders.sync'
  | 'market.read'
  | 'market.manage'
  | 'market.self'
  | 'tree.read'
  | 'tree.export'
  | 'events.manage'
  | 'events.read'
  | 'events.checkin'
  | 'events.export'
  | 'unity.read'
  | 'unity.manage'
  | 'radio.read'
  | 'radio.manage'
  | 'backstage.read'
  | 'backstage.manage'
  | 'auctions.read'
  | 'auctions.manage'
  | 'analytics.read'
  | 'analytics.export'
  | 'config.manage'
  | 'tree.update'
  | 'community.read'
  | 'community.moderate'
  | 'audit.read';

/** Todas las capacidades conocidas (fuente única compartida con el bootstrap). */
export const ALL_CAPABILITIES = ADMIN_CAPABILITIES as readonly AdminCapability[];

/** Mapa explícito rol → capacidades. */
const capabilitySet = new Set<string>(ALL_CAPABILITIES);
export const ROLE_CAPABILITIES = Object.fromEntries(
  ADMIN_ROLES_META.map((role) => {
    const capabilities =
      role.capabilities === '*'
        ? ALL_CAPABILITIES
        : (role.capabilities as readonly AdminCapability[]);
    if (!capabilities.every((capability) => capabilitySet.has(capability))) {
      throw new Error(`El rol ${role.key} declara una capacidad desconocida.`);
    }
    return [role.key, capabilities];
  }),
) as Record<AdminRole, readonly AdminCapability[]>;

/** ¿Un rol tiene una capacidad? Función pura, sin efectos. */
export function hasCapability(role: AdminRole, capability: AdminCapability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}
