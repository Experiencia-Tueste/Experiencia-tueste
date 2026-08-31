import type { CurrentAdmin } from '@/features/admin/authorization-core';

export interface PostSignInDestination {
  pathname: '/admin' | '/experiencia';
  searchParams?: Record<string, string>;
}

/**
 * Una sola puerta de entrada, dos destinos decididos por el servidor.
 * La presencia de un administrador ya fue validada contra el RBAC
 * persistente; nunca se decide con metadata editable del proveedor.
 */
export function postSignInDestination(admin: CurrentAdmin | null): PostSignInDestination {
  if (admin) return { pathname: '/admin' };
  return { pathname: '/experiencia', searchParams: { bienvenida: '1' } };
}
