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
    render(<TrackList tracks={TRACKS} selectedId="origen-111" onSelect={vi.fn()} />);

    expect(screen.queryByText(/keyboard/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /coherencia 432 hz/i })).toBeInTheDocument();
  });
});
