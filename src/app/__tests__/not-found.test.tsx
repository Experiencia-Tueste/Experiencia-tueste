import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NotFound from '../not-found';

/**
 * Pruebas de la página 404: semántica (heading) y enlace interno de
 * retorno al inicio. Interacción y assertions del DOM, sin texto fuente.
 */
describe('not-found (página 404)', () => {
  it('muestra el título como heading y una explicación breve', () => {
    render(<NotFound />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Página no encontrada' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/no existe o fue movida/i)).toBeInTheDocument();
  });

  it('ofrece un enlace interno para volver al inicio', () => {
    render(<NotFound />);

    const home = screen.getByRole('link', { name: 'Volver al inicio' });
    expect(home).toHaveAttribute('href', '/');
  });
});
