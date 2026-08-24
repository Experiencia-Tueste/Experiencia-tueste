import type { AdminRole } from './permissions';

/**
 * Núcleo de autorización — lógica PURA y testeable, sin Auth.js, sin
 * next/navigation, sin red. `authorization.ts` (server-only) la consume
 * junto con `auth()` de Auth.js.
 */

/**
 * Decide el rol de un correo contra la allowlist.
 *
 * @returns `'admin'` (rol temporal de la Fase 1.1) si el correo está
 *   permitido, `null` en caso contrario (o sin correo). En la Fase 1.2
 *   el rol provendrá de la base de datos.
 */
export function resolveAdminRole(
  email: string | null | undefined,
  allowedEmails: string[],
): AdminRole | null {
  const normalized = email?.trim().toLowerCase() ?? '';
  if (normalized === '') return null;
  return allowedEmails.includes(normalized) ? 'admin' : null;
}
