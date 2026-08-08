import { render } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import RootLayout from '../layout';

describe('RootLayout (SSR sin hydration mismatch)', () => {
  /**
   * SSR real con renderToStaticMarkup: renderizar el layout en el DOM
   * de testing-library (jsdom) descarta `<html>` y `<head>` porque van
   * dentro de un `<div>`; el markup estático reproduce exactamente lo
   * que el servidor enviaría al navegador.
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
  });

  it('en el DOM de testing-library el hijo es accesible', () => {
    const { getByTestId } = render(
      <RootLayout>
        <div data-testid="child">contenido</div>
      </RootLayout>,
    );

    expect(getByTestId('child').textContent).toBe('contenido');
  });
});
