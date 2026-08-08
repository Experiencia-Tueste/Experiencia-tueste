/**
 * Cabeceras de seguridad base para la aplicación pública.
 * ---------------------------------------------------------------------
 * Módulo puro (sin dependencias de Next ni de red): importable desde
 * `next.config.mjs` y desde las pruebas, sin duplicar valores.
 *
 * Decisiones explícitas:
 * - CSP: NO se añade todavía. El proyecto carga fuentes externas
 *   (Google Fonts) y una CSP debe diseñarse tras una auditoría
 *   específica de orígenes.
 * - HSTS: NO se añade. Solo debe activarse cuando exista un dominio
 *   HTTPS de producción confirmado.
 */

export const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
];

/** Regla global de cabeceras para todas las rutas (`/:path*`). */
export function securityHeaders() {
  return [{ source: '/:path*', headers: SECURITY_HEADERS }];
}
