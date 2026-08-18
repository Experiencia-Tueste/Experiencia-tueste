/**
 * Cabeceras de seguridad base para la aplicación pública.
 * ---------------------------------------------------------------------
 * Módulo puro (sin dependencias de Next ni de red): importable desde
 * `next.config.mjs` y desde las pruebas, sin duplicar valores.
 *
 * Decisiones explícitas:
 * - CSP: se envía SOLO en modo `Content-Security-Policy-Report-Only`
 *   (no bloquea; solo reporta a la consola). Se promoverá a
 *   `Content-Security-Policy` en staging una vez verificado que la
 *   experiencia no se rompe. Para promoverla, cambiar la clave de esta
 *   constante de `Content-Security-Policy-Report-Only` a
 *   `Content-Security-Policy` — sin tocar el valor.
 * - `'unsafe-inline'` en style-src y script-src: Next.js (y Turbopack)
 *   inyectan estilos y scripts inline para la hidratación; quitarla
 *   requiere hashes/nonces por build, pendiente de una auditoría
 *   específica.
 * - HSTS: NO se añade. Solo debe activarse cuando exista un dominio
 *   HTTPS de producción confirmado (AWS Route 53 + CloudFront).
 * - frame-ancestors 'none': la app no debe poder embeberse en iframes
 *   ajenos; X-Frame-Options queda en DENY como respaldo para clientes
 *   que no lean CSP.
 * - Los orígenes permitidos son exactamente los que la app usa hoy:
 *   self (assets locales), Google Fonts (stylesheet + font files) y
 *   OpenFreeMap (tiles del mapa de origen — proveedor PROVISIONAL sin
 *   SLA, se sustituirá antes del lanzamiento). No se añaden dominios
 *   por anticipación ni comodines.
 */

const CSP_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://tiles.openfreemap.org",
  "media-src 'self'",
  "font-src 'self' https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://tiles.openfreemap.org",
  'worker-src blob:',
  'child-src blob:',
].join('; ');

export const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  {
    key: 'Content-Security-Policy-Report-Only',
    value: CSP_POLICY,
  },
];

/** Regla global de cabeceras para todas las rutas (`/:path*`). */
export function securityHeaders() {
  return [{ source: '/:path*', headers: SECURITY_HEADERS }];
}
