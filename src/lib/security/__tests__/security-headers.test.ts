import { describe, expect, it } from 'vitest';
import nextConfig from '../../../../next.config.mjs';

/**
 * Pruebas puras de las cabeceras de seguridad de `next.config.mjs`:
 * sin servidor, sin red y sin jsdom (entorno node). Verifica la regla
 * global, los valores exactos y la ausencia de duplicados.
 */
async function getRules() {
  const headersFn = nextConfig.headers;
  if (!headersFn) {
    throw new Error('headers() no está definida en next.config.mjs');
  }
  return headersFn();
}

describe('cabeceras de seguridad (next.config.mjs)', () => {
  it('aplica una única regla global para todas las rutas', async () => {
    const rules = await getRules();

    expect(rules).toHaveLength(1);
    expect(rules[0].source).toBe('/:path*');
  });

  it('incluye todas las cabeceras con sus valores exactos', async () => {
    const rules = await getRules();

    expect(rules[0].headers).toEqual([
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
        value:
          "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; " +
          "form-action 'self'; img-src 'self' data: blob: https://tiles.openfreemap.org; " +
          "media-src 'self'; font-src 'self' https://fonts.gstatic.com; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "script-src 'self' 'unsafe-inline'; " +
          "connect-src 'self' https://tiles.openfreemap.org; " +
          'worker-src blob:; child-src blob:',
      },
    ]);
  });

  it('no duplica nombres de cabecera', async () => {
    const rules = await getRules();
    const keys = rules[0].headers.map((h) => h.key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('la CSP no contiene comodines (*) en ninguna directiva', async () => {
    const rules = await getRules();
    const csp = rules[0].headers.find((h) => h.key.startsWith('Content-Security-Policy'));

    expect(csp).toBeDefined();
    expect(csp!.value).not.toContain('*');
  });

  it('la CSP sigue en modo Report-Only (no bloqueante)', async () => {
    const rules = await getRules();
    expect(rules[0].headers.some((h) => h.key === 'Content-Security-Policy')).toBe(false);
    expect(rules[0].headers.some((h) => h.key === 'Content-Security-Policy-Report-Only')).toBe(
      true,
    );
  });

  it('no activa HSTS todavía (pendiente de dominio HTTPS AWS)', async () => {
    const rules = await getRules();
    expect(rules[0].headers.some((h) => h.key === 'Strict-Transport-Security')).toBe(false);
  });

  it('incluye las directivas mínimas de MapLibre y del proveedor temporal de tiles', async () => {
    const rules = await getRules();
    const csp = rules[0].headers.find((h) => h.key.startsWith('Content-Security-Policy'))!;

    expect(csp.value).toContain('worker-src blob:');
    expect(csp.value).toContain('child-src blob:');
    expect(csp.value).toContain("connect-src 'self' https://tiles.openfreemap.org");
    expect(csp.value).toContain("img-src 'self' data: blob: https://tiles.openfreemap.org");
    // Sin comodines en los orígenes del proveedor.
    expect(csp.value).not.toContain('https://*');
  });
});
