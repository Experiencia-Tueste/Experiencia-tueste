import 'server-only';

import { loadAdminAuthConfig } from '../auth/admin-config';
import type { AdminAuthConfig, AdminAuthEnv } from '../auth/admin-config';

/**
 * Puente de configuración del panel (módulo permitido por la frontera
 * cliente/servidor): aquí vive el único acceso a `process.env` de la
 * autenticación admin. `admin-config.ts` se mantiene puro e inyectable.
 */
export function loadAdminConfig(): AdminAuthConfig {
  return loadAdminAuthConfig(process.env as AdminAuthEnv);
}
