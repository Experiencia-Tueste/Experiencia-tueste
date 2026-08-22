import { z } from 'zod';

/**
 * Contrato de configuración PÚBLICA (src/lib/config/env-public).
 * ---------------------------------------------------------------------
 * Único módulo que lee variables con prefijo `NEXT_PUBLIC_*`, que son
 * públicas por diseño (van al bundle del navegador). Aquí NO viven
 * secretos: nunca añadir service-role keys, tokens ni contraseñas.
 *
 * La configuración de servidor (SITE_URL, SHOPIFY_STORE_URL) vive en
 * `env-server.ts`, protegida con `import 'server-only'`.
 */

const SUPABASE_URL_SCHEMA = z.string().url();

export interface SupabasePublicConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/** Clave pública de MapTiler, restringida por dominio en su panel. */
export interface MapTilerPublicConfig {
  mapTilerKey: string;
}

/** Entorno de variables públicas (inyectable para pruebas). */
export type PublicEnv = Record<string, string | undefined>;

/**
 * Lee y valida la configuración pública de Supabase.
 *
 * @param env Entorno a leer (por defecto `process.env`); inyectable para
 *   pruebas sin depender del entorno real de la máquina.
 * @returns `null` en modo demo (sin configuración) o el objeto tipado
 *   con ambas credenciales. Lanza un error claro si la configuración es
 *   parcial o la URL no es válida.
 */
export function loadPublicConfig(env: PublicEnv = process.env): SupabasePublicConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const urlPresent = typeof url === 'string' && url.trim() !== '';
  const keyPresent = typeof anonKey === 'string' && anonKey.trim() !== '';

  // Modo demo: sin configuración, sin errores.
  if (!urlPresent && !keyPresent) {
    return null;
  }

  // Configuración parcial: fallar claro, nunca a medias.
  if (urlPresent && !keyPresent) {
    throw new Error(
      'Configuración incompleta: falta NEXT_PUBLIC_SUPABASE_ANON_KEY (o vacía). Define ambas variables o ninguna para el modo demo.',
    );
  }
  if (!urlPresent && keyPresent) {
    throw new Error(
      'Configuración incompleta: falta NEXT_PUBLIC_SUPABASE_URL (o está vacía). Define ambas variables o ninguna para el modo demo.',
    );
  }

  const parsedUrl = SUPABASE_URL_SCHEMA.safeParse(url);
  if (!parsedUrl.success) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL no es una URL válida: «${url}». Revisa el valor en tu .env.local.`,
    );
  }

  return { supabaseUrl: parsedUrl.data, supabaseAnonKey: anonKey as string };
}

/**
 * Lee la clave pública de MapTiler para la cartografía editorial.
 *
 * No es una clave secreta: MapTiler la usa desde el navegador. Debe
 * restringirse por referer/origen en el panel de MapTiler y nunca
 * sustituirse por una clave de servidor o una credencial de AWS.
 *
 * @param env Entorno a leer (por defecto `process.env`); inyectable
 *   para pruebas sin depender del entorno real de la máquina.
 * @returns `null` sin clave (modo demo: fallback editorial del mapa).
 */
export function loadMapTilerPublicConfig(
  env: PublicEnv = process.env,
): MapTilerPublicConfig | null {
  // El acceso literal a `process.env.NEXT_PUBLIC_*` es imprescindible:
  // Turbopack/Webpack solo inlinean en el bundle del navegador las
  // referencias DIRECTAS a `process.env.NEXT_PUBLIC_*`. Un lookup
  // dinámico como `env.NEXT_PUBLIC_*` NO se reemplaza y llegaría vacío
  // al cliente. El parámetro `env` (inyectado por las pruebas) conserva
  // prioridad para que los tests no dependan del entorno real.
  const mapTilerKey = (
    env.NEXT_PUBLIC_MAPTILER_API_KEY ?? process.env.NEXT_PUBLIC_MAPTILER_API_KEY
  )?.trim();

  return mapTilerKey ? { mapTilerKey } : null;
}
