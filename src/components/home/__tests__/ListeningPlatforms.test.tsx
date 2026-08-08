import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ListeningPlatforms, { PLATFORMS } from '../ListeningPlatforms';

describe('ListeningPlatforms (Llévatelo a donde escuches)', () => {
  it('renderiza las cinco plataformas con nombre y subtítulo', () => {
    render(<ListeningPlatforms />);

    expect(screen.getByRole('heading', { name: 'Llévatelo a donde escuches' })).toBeInTheDocument();

    for (const p of PLATFORMS) {
      expect(screen.getByText(p.nombre)).toBeInTheDocument();
      expect(screen.getByText(p.subtitulo)).toBeInTheDocument();
    }
  });

  it('Spotify es un enlace seguro a la URL oficial del artista', () => {
    render(<ListeningPlatforms />);

    const spotify = screen.getByRole('link', { name: /Spotify/ });
    expect(spotify).toHaveAttribute(
      'href',
      'https://open.spotify.com/artist/50lPI20KEXnXbYY2G8i787',
    );
    expect(spotify).toHaveAttribute('target', '_blank');
    expect(spotify).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('las otras cuatro plataformas no fingen enlaces', () => {
    const { container } = render(<ListeningPlatforms />);

    const noInteractivas = PLATFORMS.filter((p) => p.url === null);
    expect(noInteractivas).toHaveLength(4);

    for (const p of noInteractivas) {
      const tarjeta = container.querySelector(`[data-platform="${p.id}"]`);
      expect(tarjeta, `tarjeta de ${p.nombre}`).not.toBeNull();
      expect(tarjeta!.querySelector('a'), `${p.nombre} no debe contener enlaces`).toBeNull();
      expect(tarjeta!.hasAttribute('href'), `${p.nombre} no debe tener href`).toBe(false);
      expect(tarjeta!.hasAttribute('tabindex'), `${p.nombre} no debe ser enfocable`).toBe(false);
    }
  });
});
