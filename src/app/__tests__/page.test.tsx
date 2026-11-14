import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Home, { dynamic, metadata } from '../page';

describe('Portal de entrada (metadata)', () => {
  it('expone la metadata específica del portal', () => {
    expect(metadata.title).toBe('Tueste · Elige tu camino');
    expect(metadata.description).toBe(
      'Tienda Tueste Co, Experiencia Origen Tostado y Tueste Tree: tres caminos nacidos del mismo origen.',
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
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('presenta el kicker, el titular y el subtítulo del hero', () => {
    render(<Home />);

    expect(screen.getByText('TUESTE · TRES CAMINOS, UN ORIGEN')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'El café también se escucha.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Tres caminos nacidos del mismo origen.')).toBeInTheDocument();
  });

  it('presenta las dos tarjetas con su contenido', () => {
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
    expect(screen.getByRole('heading', { level: 2, name: 'Tueste Tree' })).toBeInTheDocument();
    expect(
      screen.getByText('Adopta un árbol y acompaña el origen desde la finca.'),
    ).toBeInTheDocument();
  });

  it('la tarjeta Experiencia enlaza a /experiencia', () => {
    render(<Home />);

    const link = screen.getByRole('link', { name: /Experiencia Origen Tostado/ });
    expect(link).toHaveAttribute('href', '/experiencia');
  });

  it('la tarjeta Tueste Tree enlaza a /tueste-tree', () => {
    render(<Home />);

    expect(screen.getByRole('link', { name: /Tueste Tree/ })).toHaveAttribute(
      'href',
      '/tueste-tree',
    );
  });

  it('sin SHOPIFY_STORE_URL muestra «Tienda próximamente» sin enlace roto', () => {
    render(<Home />);

    expect(screen.getByText('Tienda próximamente')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Entrar a la tienda/ })).not.toBeInTheDocument();
  });

  it('con SHOPIFY_STORE_URL válida enlaza a la tienda', () => {
    vi.stubEnv('SHOPIFY_STORE_URL', 'https://tienda.example.com');

    render(<Home />);

    expect(screen.getByRole('link', { name: /Entrar a la tienda/ })).toHaveAttribute(
      'href',
      'https://tienda.example.com',
    );
    expect(screen.queryByText('Tienda próximamente')).not.toBeInTheDocument();
  });

  it('con SHOPIFY_STORE_URL inválida no rompe el portal: muestra «Tienda próximamente»', () => {
    vi.stubEnv('SHOPIFY_STORE_URL', '"https://tienda.example.com"');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<Home />);

    expect(screen.getByText('Tienda próximamente')).toBeInTheDocument();
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain('tienda.example.com');
    consoleError.mockRestore();
  });

  it('se renderiza por petición para leer la URL de la tienda en runtime, no en el build', () => {
    expect(dynamic).toBe('force-dynamic');
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
    expect(srcs.some((s) => s.includes('/images/tueste-tree/lote-000-cafetal-v1.png'))).toBe(true);

    for (const img of images) {
      const src = decodeURIComponent(img.getAttribute('src') ?? '');
      if (src.includes('/images/portal/') || src.includes('/images/tueste-tree/')) {
        expect(img.getAttribute('alt')).toBe('');
        expect(img.closest('[aria-hidden="true"]')).not.toBeNull();
      }
    }
  });
});
