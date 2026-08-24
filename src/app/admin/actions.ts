'use server';

import { signIn, signOut } from '@/auth';

/**
 * Server Actions mínimas y seguras del panel: iniciar y cerrar sesión
 * con Google. No hay endpoints de negocio ni lógica de autorización
 * aquí: la autorización vive en el servidor (authorization.ts).
 */

/** Inicia sesión con Google y vuelve al panel. */
export async function loginWithGoogle() {
  await signIn('google', { redirectTo: '/admin' });
}

/** Cierra la sesión y vuelve a la pantalla de acceso. */
export async function logout() {
  await signOut({ redirectTo: '/admin/login' });
}
