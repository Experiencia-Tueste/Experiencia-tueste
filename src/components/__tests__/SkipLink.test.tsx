import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SkipLink from '../SkipLink';

/**
 * Pruebas de accesibilidad del SkipLink: identidad, texto accesible y
 * destino del salto. Sin depender de implementación interna.
 */
describe('SkipLink (accesibilidad)', () => {
  it('expone el ID estable, el texto accesible y el destino #contenido', () => {
    render(<SkipLink />);

    const link = screen.getByRole('link', { name: 'Saltar al contenido principal' });

    expect(link).toHaveAttribute('id', 'skip-link');
    expect(link).toHaveAttribute('href', '#contenido');
  });
});
