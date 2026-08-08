import { createBrowserClient } from '@supabase/ssr';
import { loadPublicConfig } from '@/lib/config/env';

/**
 * Cliente Supabase para el navegador.
 *
 * La base técnica está lista, pero la persistencia real (auth, perfiles,
 * puntos, subastas) se activa por fases según el plan de arquitectura.
 * La configuración se lee exclusivamente del contrato de
 * `src/lib/config/env.ts`: si no hay variables, `loadPublicConfig`
 * devuelve `null` y la app funciona en modo demo sin servicios.
 */
export function createClient() {
  const config = loadPublicConfig();

  if (!config) {
    return null;
  }

  return createBrowserClient(config.supabaseUrl, config.supabaseAnonKey);
}

/** Cliente tipado listo para consumir (o null en modo demo). */
export const supabase = createClient();
