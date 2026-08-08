import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import RootLayout from '../layout';

describe('RootLayout (SSR sin hydration mismatch)', () => {
  /**
   * SSR real con renderToStaticMarkup: reproduce exactamente lo que el
   * servidor enviaría al navegador. No se usa Testing Library (render)
   * porque monta el layout en un <div>, anidando <html> inválidamente
   * y generando un warning falso de hidratación.
   */
  const markup = renderToStaticMarkup(
    <RootLayout>
      <div data-testid="child">contenido</div>
    </RootLayout>,
  );

  it('entrega <html lang="es" class="js"> desde el servidor', () => {
    expect(markup).toContain('<html lang="es" class="js">');
  });

  it('incluye un fallback <noscript> para [data-reveal]', () => {
    expect(markup).toContain('<noscript>');
    expect(markup).toContain('[data-reveal]');
    expect(markup).toContain('opacity:1');
    expect(markup).toContain('transform:none');
  });

  it('no inyecta un script que mute document.documentElement', () => {
    expect(markup).not.toContain('documentElement');
    expect(markup).not.toContain('classList');
  });

  it('el hijo se renderiza dentro del body', () => {
    expect(markup).toContain('contenido');
    expect(markup).toContain('data-testid="child"');
    // El hijo debe estar entre <body> y </body>.
    const bodyStart = markup.indexOf('<body>');
    const bodyEnd = markup.indexOf('</body>');
    const childPos = markup.indexOf('data-testid="child"');
    expect(childPos).toBeGreaterThan(bodyStart);
    expect(childPos).toBeLessThan(bodyEnd);
  });
});
