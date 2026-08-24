/**
 * Roles y capacidades del panel administrativo — lógica pura.
 * ---------------------------------------------------------------------
 * Sin React, sin red, sin persistencia: define el mapa explícito
 * rol → capacidades y la función `hasCapability`. Los permisos se
 * validan en servidor por capacidad, nunca solo ocultando botones en
 * cliente.
 */

export type AdminRole = 'owner' | 'admin' | 'editor' | 'operador' | 'moderador' | 'lector';

export type AdminCapability =
  | 'admin.access'
  | 'users.manage'
  | 'content.read'
  | 'content.edit'
  | 'content.publish'
  | 'crm.read'
  | 'crm.manage'
  | 'events.manage'
  | 'tree.update'
  | 'community.moderate'
  | 'audit.read';

/** Todas las capacidades conocidas (fuente única). */
export const ALL_CAPABILITIES: readonly AdminCapability[] = [
  'admin.access',
  'users.manage',
  'content.read',
  'content.edit',
  'content.publish',
  'crm.read',
  'crm.manage',
  'events.manage',
  'tree.update',
  'community.moderate',
  'audit.read',
];

/** Mapa explícito rol → capacidades. */
export const ROLE_CAPABILITIES: Record<AdminRole, readonly AdminCapability[]> = {
  owner: ALL_CAPABILITIES,
  admin: [
    'admin.access',
    'content.read',
    'content.edit',
    'content.publish',
    'crm.read',
    'crm.manage',
    'events.manage',
    'tree.update',
    'community.moderate',
    'audit.read',
  ],
  editor: ['admin.access', 'content.read', 'content.edit'],
  operador: ['admin.access', 'crm.read', 'crm.manage', 'events.manage', 'tree.update'],
  moderador: ['admin.access', 'community.moderate'],
  lector: ['admin.access', 'content.read', 'crm.read'],
};

/** ¿Un rol tiene una capacidad? Función pura, sin efectos. */
export function hasCapability(role: AdminRole, capability: AdminCapability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}
