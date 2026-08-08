import { z } from 'zod';

/**
 * Contrato único de configuración pública (src/lib/config).
 * ---------------------------------------------------------------------
 * Solo variables públicas de Supabase. Sin service role keys ni
 * variables privadas: los componentes cliente nunca deben leer
 * process.env directamente.
 *
 * Modo demo: si ambas variables están vacías o ausentes, `loadPublicConfig`
 * devuelve `null` y la app funciona sin servicios. Si la configuración
 * está incompleta o la URL no es válida, lanza un error claro en lugar de
 * fallar silenciosamente.
 */

const SUPABASE_URL_SCHEMA = z.string().url();
const SITE_URL_SCHEMA = z.string().url();

export interface SupabasePublicConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
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
 * URL canónica del sitio (server-only por uso: solo la consume el
 * Server Component del layout para `metadataBase`; no se exporta a
 * componentes cliente).
 *
 * Lee únicamente `SITE_URL` (no es secreto; sirve para canonical URL,
 * Open Graph y Twitter). Si está ausente o vacía, usa
 * `http://localhost:3000` exclusivamente como fallback local de
 * desarrollo/build. Si está presente pero no es una URL absoluta
 * válida, lanza un error claro.
 *
 * Antes de producción se configura `SITE_URL` con el dominio público
 * HTTPS real (p. ej. en Railway); no se hardcodea ningún dominio.
 */
export function loadSiteUrl(env: PublicEnv = process.env): string {
  const raw = env.SITE_URL;

  if (typeof raw !== 'string' || raw.trim() === '') {
    return 'http://localhost:3000';
  }

  const parsed = SITE_URL_SCHEMA.safeParse(raw.trim());
  if (!parsed.success) {
    throw new Error(
      `SITE_URL no es una URL absoluta válida: «${raw}». Usa el dominio público HTTPS real (p. ej. https://tueste.up.railway.app) o deja la variable vacía para el fallback local.`,
    );
  }

  return parsed.data;
}
