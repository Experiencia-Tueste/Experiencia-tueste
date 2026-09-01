import type { AdminCapability } from '@/features/admin/permissions';

export type AdminNavigationItem = {
  href: string;
  label: string;
  group: string;
  capability?: AdminCapability;
};

/**
 * Navegación canónica del panel. Las rutas pueden existir antes que el
 * dominio esté implementado, pero nunca aparecen para un usuario sin la
 * capacidad correspondiente.
 */
export const ADMIN_NAVIGATION: readonly AdminNavigationItem[] = [
  { href: '/admin', label: 'Resumen', group: 'General' },
  { href: '/admin/adopciones', label: 'Tueste Tree', group: 'Operación', capability: 'tree.read' },
  {
    href: '/admin/cumplimiento',
    label: 'Cumplimiento y finca',
    group: 'Operación',
    capability: 'tree.read',
  },
  {
    href: '/admin/pedidos',
    label: 'Pedidos y tienda',
    group: 'Operación',
    capability: 'orders.read',
  },
  {
    href: '/admin/mercado',
    label: 'Mercado y vendedores',
    group: 'Operación',
    capability: 'market.read',
  },
  { href: '/admin/radio', label: 'Radio Origen B2B', group: 'Operación', capability: 'radio.read' },
  { href: '/admin/unity', label: 'Tueste Unity', group: 'Operación', capability: 'unity.read' },
  {
    href: '/admin/comunidad',
    label: 'Comunidad y TuesteX',
    group: 'Operación',
    capability: 'community.read',
  },
  {
    href: '/admin/subastas',
    label: 'Subastas',
    group: 'Operación',
    capability: 'auctions.read',
  },
  {
    href: '/admin/backstage',
    label: 'Backstage',
    group: 'Operación',
    capability: 'backstage.read',
  },
  {
    href: '/admin/eventos',
    label: 'Boletería y eventos',
    group: 'Operación',
    capability: 'events.read',
  },
  {
    href: '/admin/contenido',
    label: 'Contenido y lanzamientos',
    group: 'Editorial',
    capability: 'content.read',
  },
  {
    href: '/admin/analitica',
    label: 'Embudo y analítica',
    group: 'Medición',
    capability: 'analytics.read',
  },
  {
    href: '/admin/usuarios',
    label: 'Usuarios y roles',
    group: 'Plataforma',
    capability: 'users.manage',
  },
  {
    href: '/admin/auditoria',
    label: 'Auditoría',
    group: 'Plataforma',
    capability: 'audit.read',
  },
  {
    href: '/admin/configuracion',
    label: 'Configuración',
    group: 'Plataforma',
    capability: 'config.manage',
  },
];

export function getVisibleAdminNavigation(
  capabilities: readonly AdminCapability[],
): readonly AdminNavigationItem[] {
  return ADMIN_NAVIGATION.filter(
    (item) => item.capability === undefined || capabilities.includes(item.capability),
  );
}
