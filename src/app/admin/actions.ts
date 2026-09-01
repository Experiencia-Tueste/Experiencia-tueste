'use server';

import { signOut } from '@/auth';
import { createServerSupabase } from '@/lib/supabase/server';

/**
 * Server Actions mínimas y seguras del panel: iniciar y cerrar sesión
 * con Google. No hay endpoints de negocio ni lógica de autorización
 * aquí: la autorización vive en el servidor (authorization.ts).
 */

/** Cierra la sesión y vuelve a la pantalla de acceso. */
export async function logout() {
  const supabase = await createServerSupabase();
  if (supabase) await supabase.auth.signOut();
  await signOut({ redirectTo: '/' });
}
