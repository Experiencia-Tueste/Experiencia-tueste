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

  it('incluye las cuatro cabeceras con sus valores exactos', async () => {
    const rules = await getRules();

    expect(rules[0].headers).toEqual([
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
      },
    ]);
  });

  it('no duplica nombres de cabecera', async () => {
    const rules = await getRules();
    const keys = rules[0].headers.map((h) => h.key);

    expect(new Set(keys).size).toBe(keys.length);
  });
});
