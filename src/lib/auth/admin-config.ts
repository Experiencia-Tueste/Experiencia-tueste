import 'server-only';

import { z } from 'zod';

/**
 * Configuración server-only del panel administrativo.
 * ---------------------------------------------------------------------
 * Módulo protegido con `import 'server-only'`: nunca puede importarse
 * desde componentes cliente. Lee únicamente variables del servidor y
 * nunca expone valores, secretos ni la lista de correos a la UI.
 *
 * Fallo cerrado (fail closed):
 * - Sin AUTH_GOOGLE_ID y AUTH_GOOGLE_SECRET → Google no está configurado
 *   y nadie puede autenticarse.
 * - Configuración PARCIAL de Google (solo una variable) → error claro.
 * - ADMIN_ALLOWED_EMAILS vacía → ningún correo autorizado.
 */

export interface AdminAuthEnv {
  AUTH_SECRET?: string;
  AUTH_GOOGLE_ID?: string;
  AUTH_GOOGLE_SECRET?: string;
  ADMIN_ALLOWED_EMAILS?: string;
}

export interface AdminAuthConfig {
  /** true solo si existen ambas variables de Google. */
  googleConfigured: boolean;
  googleClientId: string;
  googleClientSecret: string;
  /** Emails normalizados (trim + lowercase, sin duplicados). */
  allowedEmails: string[];
  /** Secreto de sesión de Auth.js (vacío si no está definido). */
  authSecret: string;
}

const EMAIL_SCHEMA = z.string().email();

/**
 * Parsea ADMIN_ALLOWED_EMAILS (CSV): normaliza mayúsculas y espacios,
 * elimina vacíos y duplicados. Una lista vacía no autoriza a nadie.
 * Lanza un error claro si algún correo no es válido.
 */
export function parseAllowedEmails(raw: string | undefined): string[] {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return [];
  }

  const unique = new Set<string>();
  for (const parte of raw.split(',')) {
    const email = parte.trim().toLowerCase();
    if (email === '') continue;
    const parsed = EMAIL_SCHEMA.safeParse(email);
    if (!parsed.success) {
      throw new Error(
        `ADMIN_ALLOWED_EMAILS contiene un correo inválido: «${email}». Revisa la lista CSV.`,
      );
    }
    unique.add(parsed.data);
  }

  return Array.from(unique);
}

/**
 * Carga y valida la configuración del panel.
 *
 * @param env Entorno inyectable (nunca `process.env` aquí: ese acceso
 *   vive en `src/lib/config/admin-auth-env.ts`).
 */
export function loadAdminAuthConfig(env: AdminAuthEnv): AdminAuthConfig {
  const googleId = env.AUTH_GOOGLE_ID?.trim() ?? '';
  const googleSecret = env.AUTH_GOOGLE_SECRET?.trim() ?? '';
  const authSecret = env.AUTH_SECRET?.trim() ?? '';
  const allowedEmails = parseAllowedEmails(env.ADMIN_ALLOWED_EMAILS);

  const idPresente = googleId !== '';
  const secretPresente = googleSecret !== '';

  if (idPresente !== secretPresente) {
    throw new Error(
      'Configuración incompleta de Google: define AUTH_GOOGLE_ID y AUTH_GOOGLE_SECRET juntas (o ninguna). El panel no puede autenticar con una configuración parcial.',
    );
  }

  if (idPresente && secretPresente && authSecret === '') {
    throw new Error(
      'AUTH_SECRET está vacía: Auth.js requiere un secreto de sesión. El panel no puede arrancar sin él.',
    );
  }

  return {
    googleConfigured: idPresente && secretPresente,
    googleClientId: googleId,
    googleClientSecret: googleSecret,
    allowedEmails,
    authSecret,
  };
}
