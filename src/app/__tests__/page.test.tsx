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

describe('Página pública (Manifiesto)', () => {
  it('expone el ancla #manifiesto y se inserta después del hero y antes de la escucha', () => {
    render(<Home />);

    expect(document.getElementById('manifiesto')).not.toBeNull();

    const headings = screen.getAllByRole('heading');
    const heroIndex = headings.findIndex((h) => h.textContent === 'OrigenTostado');
    const manifiestoIndex = headings.findIndex((h) => h.textContent === 'Manifiesto');
    const escuchaIndex = headings.findIndex((h) => h.textContent === 'Escucha el origen');

    expect(heroIndex).toBeGreaterThanOrEqual(0);
    expect(manifiestoIndex).toBeGreaterThan(heroIndex);
    expect(escuchaIndex).toBeGreaterThan(manifiestoIndex);
  });

  it('mantiene el contenido exacto del documento maestro', () => {
    render(<Home />);

    // Matcher por textContent completo: los párrafos con <del>/<em>
    // dividen el texto en varios nodos y getByText busca por nodo.
    const byText = (text: string) => (_c: string, element?: Element | null) =>
      element?.textContent === text;

    expect(screen.getByText('La música nace del territorio.')).toBeInTheDocument();
    expect(screen.getByText('Las frecuencias nacen del sonido de la finca.')).toBeInTheDocument();
    expect(screen.getByText(byText('El café no acompaña a la música.'))).toBeInTheDocument();
    expect(screen.getByText(byText('La música nace del café.'))).toBeInTheDocument();
    expect(screen.getByText('— Origen Tostado · Eje Cafetero, Colombia')).toBeInTheDocument();
  });
});
