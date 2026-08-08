import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TRACKS } from '@/features/audio';
import TrackList from '../home/TrackList';

/**
 * Render visible de la lista de pistas: garantiza que el texto
 * accidental «keyboard» no aparece en el DOM renderizado.
 */
describe('TrackList (render visible)', () => {
  it('no muestra el texto "keyboard" en el DOM', () => {
    render(
      <TrackList tracks={TRACKS} selectedId="origen-111" playing={false} onSelect={vi.fn()} />,
    );

    expect(screen.queryByText(/keyboard/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /coherencia 432 hz/i })).toBeInTheDocument();
  });

  it('marca la pista activa como playing solo mientras suena', () => {
    const { container, rerender } = render(
      <TrackList tracks={TRACKS} selectedId="origen-111" playing={false} onSelect={vi.fn()} />,
    );

    const activa = container.querySelector('[aria-pressed="true"]');
    expect(activa).not.toBeNull();
    // Los CSS modules se hashean en los tests (_playing_xxxx): se
    // verifica el nombre de clase por substring.
    expect(activa?.className).not.toContain('playing');

    rerender(<TrackList tracks={TRACKS} selectedId="origen-111" playing onSelect={vi.fn()} />);

    expect(activa?.className).toContain('playing');
  });
});
