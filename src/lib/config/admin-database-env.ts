import 'server-only';

/**
 * Puente de configuración de la base administrativa (módulo permitido
 * por la frontera cliente/servidor): aquí vive el único acceso a
 * `process.env.DATABASE_URL`. Nunca con prefijo NEXT_PUBLIC_, sin anon
 * key ni service role.
 */
export function loadDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.DATABASE_URL;
  if (typeof url !== 'string' || url.trim() === '') {
    throw new Error(
      'DATABASE_URL no está definida. Configúrala únicamente en .env.local (nunca con prefijo NEXT_PUBLIC_).',
    );
  }
  return url;
}
