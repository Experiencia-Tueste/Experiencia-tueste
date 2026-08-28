import 'server-only';

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
 * - La autorización final la decide el RBAC persistente (usuario activo
 *   con rol en PostgreSQL), no una allowlist.
 */

export interface AdminAuthEnv {
  AUTH_SECRET?: string;
  AUTH_GOOGLE_ID?: string;
  AUTH_GOOGLE_SECRET?: string;
}

export interface AdminAuthConfig {
  /** true solo si existen ambas variables de Google. */
  googleConfigured: boolean;
  googleClientId: string;
  googleClientSecret: string;
  /** Secreto de sesión de Auth.js (vacío si no está definido). */
  authSecret: string;
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
    authSecret,
  };
}
