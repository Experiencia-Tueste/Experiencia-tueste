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

  it('Spotify conserva su enlace oficial y seguro', () => {
    render(<ListeningPlatforms />);

    const spotify = screen.getByRole('link', { name: /Spotify/ });
    expect(spotify).toHaveAttribute(
      'href',
      'https://open.spotify.com/artist/50lPI20KEXnXbYY2G8i787',
    );
    expect(spotify).toHaveAttribute('target', '_blank');
    expect(spotify).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('las cuatro plataformas usan sus URLs oficiales exactas', () => {
    render(<ListeningPlatforms />);

    const esperadas: Record<string, string> = {
      'Apple Music': 'https://music.apple.com/co/artist/origen-tostado/1875514832',
      YouTube: 'https://youtube.com/channel/UCQ50GL0flNpt4SdWpnUFU8g?si=ZkhIxWQWY3mXVTLN',
      Beatport: 'https://www.beatport.com/es/label/logik-pro/26143',
      SoundCloud: 'https://soundcloud.com/tueste',
    };

    for (const [nombre, url] of Object.entries(esperadas)) {
      const link = screen.getByRole('link', { name: new RegExp(nombre) });
      expect(link, `enlace de ${nombre}`).toHaveAttribute('href', url);
    }
  });

  it('todos los enlaces abren pestaña nueva de forma segura', () => {
    render(<ListeningPlatforms />);

    const enlaces = screen.getAllByRole('link');
    expect(enlaces).toHaveLength(5);
    for (const link of enlaces) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('cada enlace tiene un nombre accesible claro', () => {
    render(<ListeningPlatforms />);

    for (const nombre of ['Spotify', 'Apple Music', 'Beatport', 'YouTube', 'SoundCloud']) {
      const link = screen.getByRole('link', {
        name: `Abrir perfil oficial de Origen Tostado en ${nombre}`,
      });
      expect(link).toBeInTheDocument();
    }
  });
});
