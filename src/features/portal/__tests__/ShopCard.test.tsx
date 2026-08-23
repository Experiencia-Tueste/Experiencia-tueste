import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ShopCard from '../components/ShopCard';

describe('ShopCard (comportamiento del CTA de la tienda)', () => {
  it('sin URL muestra «Tienda próximamente» sin enlace roto', () => {
    const { container } = render(<ShopCard storeUrl={null} />);

    expect(screen.getByText('Tienda próximamente')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Entrar a la tienda/ })).not.toBeInTheDocument();
    expect(container.querySelector('a[href]')).toBeNull();
  });

  it('con URL válida el CTA es un enlace externo seguro', () => {
    render(<ShopCard storeUrl="https://tienda.tueste.co" />);

    const link = screen.getByRole('link', { name: /Entrar a la tienda/ });
    expect(link).toHaveAttribute('href', 'https://tienda.tueste.co');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer noopener');
    expect(screen.getByText('Entrar a la tienda')).toBeInTheDocument();
    expect(screen.queryByText('Tienda próximamente')).not.toBeInTheDocument();
  });

  it('muestra la flecha externa solo como decoración', () => {
    const { container } = render(<ShopCard storeUrl="https://tienda.tueste.co" />);

    const arrow = container.querySelector('[aria-hidden="true"]');
    expect(arrow).not.toBeNull();
  });
});
