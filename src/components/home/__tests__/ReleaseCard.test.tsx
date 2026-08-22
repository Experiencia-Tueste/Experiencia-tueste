import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RELEASES } from '@/features/music';
import type { Release } from '@/features/music';
import ReleaseCard from '../ReleaseCard';

/**
 * Pruebas de la tarjeta de lanzamiento: CTA de compra honesto (no
 * disponible vs. disponible con purchaseUrl), Spotify y portadas
 * locales con alt.
 */

vi.mock('next/image', () => ({
  default: (props: { src: string; alt?: string }) =>
    createElement('img', { src: props.src, alt: props.alt ?? '' }),
}));

const onSelect = vi.fn();

describe('ReleaseCard (compra)', () => {
  it('con purchaseStatus unavailable muestra «Compra próximamente» deshabilitado', () => {
    render(<ReleaseCard release={RELEASES[0]} onSelect={onSelect} />);

    const boton = screen.getByRole('button', { name: 'Compra próximamente' });
    expect(boton).toBeDisabled();
    expect(screen.queryByRole('link', { name: 'Comprar' })).not.toBeInTheDocument();
    expect(screen.queryByText('#')).not.toBeInTheDocument();
  });

  it('con purchaseStatus available y purchaseUrl muestra «Comprar» enlazando esa URL', () => {
    const release: Release = {
      ...RELEASES[0],
      purchaseStatus: 'available',
      purchaseUrl: 'https://ejemplo.test/compra/from-coffee-to-frequencies',
    };
    render(<ReleaseCard release={release} onSelect={onSelect} />);

    const link = screen.getByRole('link', { name: 'Comprar' });
    expect(link).toHaveAttribute('href', 'https://ejemplo.test/compra/from-coffee-to-frequencies');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
    expect(screen.queryByRole('button', { name: 'Compra próximamente' })).not.toBeInTheDocument();
  });

  it('Spotify abre en pestaña nueva con rel=noreferrer cuando spotifyUrl existe', () => {
    render(<ReleaseCard release={RELEASES[0]} onSelect={onSelect} />);

    const spotify = screen.getByRole('link', { name: /Escuchar en Spotify/ });
    expect(spotify).toHaveAttribute('target', '_blank');
    expect(spotify).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('sin spotifyUrl no renderiza el enlace de Spotify', () => {
    render(<ReleaseCard release={RELEASES[3]} onSelect={onSelect} />);

    expect(screen.queryByRole('link', { name: /Escuchar en Spotify/ })).not.toBeInTheDocument();
  });
});

describe('ReleaseCard (portadas)', () => {
  it('sin coverImage usa el fallback editorial SVG (sin imagen rota)', () => {
    const release: Release = { ...RELEASES[0], coverImage: '' };
    const { container } = render(<ReleaseCard release={release} onSelect={onSelect} />);

    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  it('con coverImage muestra el asset local con alt descriptivo', () => {
    const release: Release = {
      ...RELEASES[0],
      coverImage: '/images/releases/from-coffee-to-frequencies-v1.webp',
    };
    const { container } = render(<ReleaseCard release={release} onSelect={onSelect} />);

    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toContain(
      '/images/releases/from-coffee-to-frequencies-v1.webp',
    );
    expect(img?.getAttribute('alt')).toBe('Portada de From Coffee to Frequencies');
  });
});
