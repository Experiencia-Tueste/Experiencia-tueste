import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Anti-regresión de render dinámico del panel: /admin y /admin/login
 * deben declarar exactamente `export const dynamic = 'force-dynamic'`
 * ANTES de la definición del componente de página, para que la sesión y
 * la configuración de Google se resuelvan por request (los secretos se
 * inyectan en runtime) y un build sin credenciales no congele redirects
 * ni estados de configuración.
 */

const PAGES = [resolve(__dirname, '../page.tsx'), resolve(__dirname, '../login/page.tsx')];

describe('admin · render dinámico por request (anti-regresión)', () => {
  it('ambas páginas administrativas declaran force-dynamic antes del componente', () => {
    for (const file of PAGES) {
      const source = readFileSync(file, 'utf-8');

      // Declaración exacta, a nivel superior y fuera de comentarios.
      const sinComentarios = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      expect(sinComentarios, file).toContain("export const dynamic = 'force-dynamic';");

      // Debe aparecer antes de la definición del componente de página.
      const idxDynamic = sinComentarios.indexOf("export const dynamic = 'force-dynamic';");
      const idxComponent = sinComentarios.indexOf('export default');
      expect(idxDynamic, 'force-dynamic debe existir').toBeGreaterThanOrEqual(0);
      expect(
        idxDynamic,
        'force-dynamic debe quedar antes de la definición del componente',
      ).toBeLessThan(idxComponent);
    }
  });

  it('no introduce patrones prohibidos para lograr el render dinámico', () => {
    for (const file of PAGES) {
      const source = readFileSync(file, 'utf-8');
      for (const forbidden of [
        'force-static',
        'revalidate',
        'cookies(',
        'headers(',
        'Date.now(',
        'Math.random(',
        'suppressHydrationWarning',
      ]) {
        expect(source, `${file} no debe contener ${forbidden}`).not.toContain(forbidden);
      }
    }
  });
});
