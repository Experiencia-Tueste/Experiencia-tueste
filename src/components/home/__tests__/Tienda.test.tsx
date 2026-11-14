import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Tienda from '../Tienda';

describe('Tienda', () => {
  it('con tienda externa configurada enlaza a Shopify en pestaña nueva', () => {
    render(
      <Tienda
        checkoutConfig={{ mode: 'external_shopify', externalShopifyUrl: 'https://tueste.co' }}
      />,
    );

    const link = screen.getByRole('link', { name: /Entrar a la tienda/ });
    expect(link).toHaveAttribute('href', 'https://tueste.co');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link).toHaveAttribute('data-commercial-intent', 'merch-tienda');
    expect(
      screen.getByText('El pago continúa en la tienda segura de Shopify.'),
    ).toBeInTheDocument();
  });

  it('sin configuración muestra «Tienda próximamente» sin enlace roto', () => {
    const { container } = render(<Tienda />);

    expect(screen.getByText('Tienda próximamente')).toBeInTheDocument();
    expect(container.querySelector('a')).toBeNull();
  });

  it('otros modos de checkout no exponen un enlace de compra', () => {
    const { container } = render(
      <Tienda checkoutConfig={{ mode: 'mercadopago_legacy', externalShopifyUrl: null }} />,
    );

    expect(container.querySelector('a')).toBeNull();
    expect(screen.getByText('Tienda próximamente')).toBeInTheDocument();
  });

  it('no ofrece productos, precios ni carrito propios', () => {
    render(
      <Tienda
        checkoutConfig={{ mode: 'external_shopify', externalShopifyUrl: 'https://tueste.co' }}
      />,
    );

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByText(/\$\s?\d/)).toBeNull();
  });
});
