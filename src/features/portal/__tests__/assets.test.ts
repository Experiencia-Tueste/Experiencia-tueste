import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Contrato de assets del portal: los tres artes locales WebP existen
 * en public/images/portal y el fondo los referencia por CSS.
 */
const PUBLIC_IMAGES = resolve(__dirname, '../../../../public/images/portal');

describe('portal assets (artes locales WebP)', () => {
  const files = [
    'portal-background-v1.webp',
    'portal-tienda-artwork-v1.webp',
    'portal-experiencia-artwork-v1.webp',
  ];

  it('los tres archivos existen en public/images/portal', () => {
    for (const f of files) {
      expect(existsSync(resolve(PUBLIC_IMAGES, f)), f).toBe(true);
    }
  });

  it('el fondo del portal referencia el path local por CSS', () => {
    const css = readFileSync(
      resolve(__dirname, '../components/PortalBackdrop.module.css'),
      'utf-8',
    );
    expect(css).toContain("url('/images/portal/portal-background-v1.webp')");
  });
});
