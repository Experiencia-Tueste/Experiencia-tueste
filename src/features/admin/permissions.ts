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

/** Todas las capacidades conocidas (fuente única). */
export const ALL_CAPABILITIES: readonly AdminCapability[] = [
  'admin.access',
  'users.manage',
  'content.read',
  'content.edit',
  'content.review',
  'content.publish',
  'crm.read',
  'crm.manage',
  'crm.export',
  'orders.read',
  'orders.manage',
  'orders.sync',
  'market.read',
  'market.manage',
  'market.self',
  'tree.read',
  'tree.export',
  'events.manage',
  'events.read',
  'events.checkin',
  'events.export',
  'unity.read',
  'unity.manage',
  'radio.read',
  'radio.manage',
  'backstage.read',
  'backstage.manage',
  'auctions.read',
  'auctions.manage',
  'analytics.read',
  'analytics.export',
  'config.manage',
  'tree.update',
  'community.read',
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
    'content.review',
    'content.publish',
    'crm.read',
    'crm.manage',
    'crm.export',
    'orders.read',
    'orders.manage',
    'orders.sync',
    'market.read',
    'market.manage',
    'tree.read',
    'tree.export',
    'events.manage',
    'events.read',
    'events.checkin',
    'events.export',
    'unity.read',
    'unity.manage',
    'radio.read',
    'radio.manage',
    'backstage.read',
    'backstage.manage',
    'auctions.read',
    'auctions.manage',
    'analytics.read',
    'analytics.export',
    'community.read',
    'tree.update',
    'community.moderate',
    'audit.read',
  ],
  editor: [
    'admin.access',
    'content.read',
    'content.edit',
    'content.review',
    'events.read',
    'events.manage',
  ],
  operador: [
    'admin.access',
    'crm.read',
    'crm.manage',
    'crm.export',
    'orders.read',
    'orders.manage',
    'market.read',
    'tree.read',
    'tree.update',
    'tree.export',
    'events.read',
    'events.manage',
    'events.checkin',
    'events.export',
    'unity.read',
    'unity.manage',
    'radio.read',
    'backstage.read',
    'backstage.manage',
  ],
  moderador: ['admin.access', 'community.read', 'community.moderate'],
  lector: [
    'admin.access',
    'content.read',
    'crm.read',
    'orders.read',
    'market.read',
    'tree.read',
    'events.read',
    'unity.read',
    'radio.read',
    'community.read',
    'backstage.read',
    'analytics.read',
  ],
};

/** ¿Un rol tiene una capacidad? Función pura, sin efectos. */
export function hasCapability(role: AdminRole, capability: AdminCapability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}
