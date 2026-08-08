/**
 * Feature: admin
 * ---------------------------------------------------------------------
 * Panel de administración: métricas, gestión de catálogo y de contenido.
 *
 * Regla del plan: las acciones de admin solo se ejecutan en rutas de
 * servidor con verificación de rol. Aquí está el contrato de tipos y la
 * lógica pura de agregación de métricas.
 */

export interface AdminMetrics {
  totalUsers: number;
  activeMemberships: number;
  totalOrders: number;
  revenueCop: number;
  pendingAuctions: number;
  communityPosts: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: string;
}

/** Métricas de ejemplo (datos del mockup). */
export const SEED_METRICS: AdminMetrics = {
  totalUsers: 1284,
  activeMemberships: 96,
  totalOrders: 312,
  revenueCop: 48_500_000,
  pendingAuctions: 2,
  communityPosts: 47,
};

export const SEED_USERS: AdminUser[] = [
  {
    id: 'u1',
    name: 'Santiago Palacio',
    email: 'santiago@tueste.co',
    role: 'admin',
    joinedAt: '2026-01-10',
  },
  {
    id: 'u2',
    name: 'María Cántara',
    email: 'maria@tueste.co',
    role: 'moderator',
    joinedAt: '2026-02-01',
  },
  {
    id: 'u3',
    name: 'Diego Ríos',
    email: 'diego@tueste.co',
    role: 'moderator',
    joinedAt: '2026-02-15',
  },
];

/** Formatea un valor COP para el panel (presentación pura). */
export function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

/** ¿Puede un usuario ejecutar acciones de administración? */
export function canAdmin(user: AdminUser): boolean {
  return user.role === 'admin';
}

/** ¿Puede moderar contenido (posts, comentarios)? */
export function canModerate(user: AdminUser): boolean {
  return user.role === 'admin' || user.role === 'moderator';
}
