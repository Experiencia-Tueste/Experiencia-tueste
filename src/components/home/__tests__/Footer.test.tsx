import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Footer from '../Footer';
import { FOOTER_GROUPS } from '@/features/site';

describe('Footer (semántica y jerarquía)', () => {
  it('contiene un <footer> como landmark', () => {
    const { container } = render(<Footer />);
    expect(container.querySelector('footer')).not.toBeNull();
  });

  it('los títulos de columna son <h2> (no <h5>)', () => {
    render(<Footer />);

    const headings = screen.getAllByRole('heading', { level: 2 });
    // Debe haber al menos tantos h2 como grupos de navegación.
    expect(headings.length).toBeGreaterThanOrEqual(FOOTER_GROUPS.length);

    for (const col of FOOTER_GROUPS) {
      expect(screen.getByRole('heading', { name: col.titulo, level: 2 })).toBeInTheDocument();
    }

    // No debe quedar ningún h5.
    expect(screen.queryAllByRole('heading', { level: 5 })).toHaveLength(0);
  });

  it('conserva el aria-label del nav', () => {
    render(<Footer />);

    expect(
      screen.getByRole('navigation', { name: 'Navegación del pie de página' }),
    ).toBeInTheDocument();
  });
});
