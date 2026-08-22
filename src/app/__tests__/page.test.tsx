import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Home, { metadata } from '../page';

describe('Portal de entrada (metadata)', () => {
  it('expone la metadata específica del portal', () => {
    expect(metadata.title).toBe('Tueste · Elige tu camino');
    expect(metadata.description).toBe(
      'Tienda Tueste Co, Experiencia Origen Tostado y Adopta tu árbol: tres caminos nacidos del mismo origen.',
    );
  });
});

describe('Portal de entrada (orden de foco por teclado)', () => {
  it('el primer Tab enfoca el SkipLink', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.tab();

    expect(screen.getByRole('link', { name: 'Saltar al contenido principal' })).toHaveFocus();
  });
});

describe('Portal de entrada (contenido)', () => {
  it('presenta el kicker, el titular y el subtítulo del hero', () => {
    render(<Home />);

    expect(screen.getByText('TUESTE · TRES CAMINOS, UN ORIGEN')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'El café también se escucha.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Tres caminos nacidos del mismo origen.')).toBeInTheDocument();
  });

  it('presenta las tres tarjetas con su contenido', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { level: 2, name: 'Tienda Tueste Co' })).toBeInTheDocument();
    expect(
      screen.getByText('Café, objetos y rituales para llevar el origen contigo.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Experiencia Origen Tostado' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Música, frecuencias y territorio para escuchar el café.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Adopta tu árbol' })).toBeInTheDocument();
    expect(
      screen.getByText('Acompaña el ciclo del café desde la tierra hasta la taza.'),
    ).toBeInTheDocument();
  });

  it('el portal contiene exactamente tres destinos principales', () => {
    const { container } = render(<Home />);

    const cards = container.querySelectorAll('main > div[class] article, main > div[class] a');
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(3);
    expect(cards.length).toBeGreaterThanOrEqual(2);

    const destinations = headings.map((heading) => heading.textContent);
    expect(destinations).toEqual([
      'Tienda Tueste Co',
      'Experiencia Origen Tostado',
      'Adopta tu árbol',
    ]);
  });

  it('la tarjeta Experiencia enlaza a /experiencia', () => {
    render(<Home />);

    const link = screen.getByRole('link', { name: /Experiencia Origen Tostado/ });
    expect(link).toHaveAttribute('href', '/experiencia');
  });

  it('la tarjeta Adopta enlaza a /adopta con su CTA', () => {
    render(<Home />);

    const link = screen.getByRole('link', { name: /Adopta tu árbol/ });
    expect(link).toHaveAttribute('href', '/adopta');
    expect(within(link).getByText('NUEVO CAMINO')).toBeInTheDocument();
    expect(within(link).getByText('Conocer la adopción')).toBeInTheDocument();
  });

  it('sin SHOPIFY_STORE_URL muestra «Tienda próximamente» sin enlace roto', () => {
    render(<Home />);

    expect(screen.getByText('Tienda próximamente')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Entrar a la tienda/ })).not.toBeInTheDocument();
  });

  it('cierra con la línea editorial del portal', () => {
    render(<Home />);

    expect(screen.getByText('UN SOLO ORIGEN · TRES FORMAS DE VIVIRLO')).toBeInTheDocument();
  });

  it('no renderiza el footer ni secciones de la experiencia', () => {
    render(<Home />);

    expect(document.getElementById('manifiesto')).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Navegación del pie de página' })).toBeNull();
  });

  it('el arte de las tarjetas es decorativo (alt vacío) y usa los paths locales', () => {
    const { container } = render(<Home />);

    const images = container.querySelectorAll('img');
    // next/image codifica el src en el loader (/_next/image?url=...):
    // se decodifica para comparar con el path local real.
    const srcs = Array.from(images).map((img) => decodeURIComponent(img.getAttribute('src') ?? ''));
    expect(srcs.some((s) => s.includes('/images/portal/portal-tienda-artwork-v1.webp'))).toBe(true);
    expect(srcs.some((s) => s.includes('/images/portal/portal-experiencia-artwork-v1.webp'))).toBe(
      true,
    );

    for (const img of images) {
      const src = decodeURIComponent(img.getAttribute('src') ?? '');
      if (src.includes('/images/portal/')) {
        expect(img.getAttribute('alt')).toBe('');
        expect(img.closest('[aria-hidden="true"]')).not.toBeNull();
      }
    }
  });
});
