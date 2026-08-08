import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Home from '../page';

/**
 * Integración mínima de la composición real de `src/app/page.tsx`:
 * con el menú cerrado, el primer Tab del documento enfoca el SkipLink
 * (primer elemento del DOM, antes del Navbar).
 */
describe('Página pública (orden de foco por teclado)', () => {
  it('con el menú cerrado, el primer Tab enfoca el SkipLink', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.tab();

    expect(screen.getByRole('link', { name: 'Saltar al contenido principal' })).toHaveFocus();
  });
});
