import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { loadPublicConfig } from '@/lib/config/env';

/**
 * Cliente Supabase para rutas de servidor (Server Components, Route
 * Handlers, Server Actions). Usa cookies para mantener la sesión.
 *
 * Regla del plan: el navegador presenta, el servidor decide. Las
 * operaciones privilegiadas (saldo, pujas, roles, cupones) se ejecutan
 * exclusivamente aquí, nunca en el cliente. La configuración se lee
 * exclusivamente del contrato de `src/lib/config/env.ts`: sin variables,
 * devuelve `null` y la app funciona en modo demo sin servicios.
 */
export async function createServerSupabase() {
  const config = loadPublicConfig();

  if (!config) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Se llama desde un Server Component: no se pueden setear cookies.
        }
      },
    },
  });
}
