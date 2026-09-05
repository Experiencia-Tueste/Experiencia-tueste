import type { CurrentAdmin } from '@/features/admin/authorization-core';

export interface PostSignInDestination {
  pathname: string;
  searchParams?: Record<string, string>;
}

const RETURN_ORIGIN = 'https://return-path.tueste.local';

/**
 * Acepta únicamente destinos públicos propios que pueden iniciar un flujo
 * de autenticación. Normalizar con URL también bloquea rutas con traversal,
 * hosts externos y variantes protocol-relative.
 */
export function safePostSignInPath(candidate: unknown): string | null {
  if (typeof candidate !== 'string' || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return null;
  }

  try {
    const destination = new URL(candidate, RETURN_ORIGIN);
    const allowed =
      destination.origin === RETURN_ORIGIN &&
      (destination.pathname === '/experiencia' ||
        destination.pathname === '/tueste-tree' ||
        destination.pathname.startsWith('/tueste-tree/'));

    if (!allowed) return null;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return null;
  }
}

/**
 * Una sola puerta de entrada y destinos decididos por el servidor.
 * La presencia de un administrador ya fue validada contra el RBAC
 * persistente; nunca se decide con metadata editable del proveedor.
 */
export function postSignInDestination(
  admin: CurrentAdmin | null,
  requestedPath?: unknown,
): PostSignInDestination {
  if (admin) return { pathname: '/admin' };
  const safePath = safePostSignInPath(requestedPath);
  if (safePath) return { pathname: safePath };
  return { pathname: '/experiencia', searchParams: { bienvenida: '1' } };
}
