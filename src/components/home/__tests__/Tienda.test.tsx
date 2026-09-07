import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Tienda from '../Tienda';

describe('Tienda', () => {
  it('agregar abre el drawer, muestra el producto y devuelve el foco a su CTA', async () => {
    const user = userEvent.setup();
    render(<Tienda />);

    const addButton = screen.getAllByRole('button', { name: 'Agregar' })[0];
    await user.click(addButton);

    expect(screen.getByRole('dialog', { name: 'Tu selección' })).toBeVisible();
    expect(screen.getAllByText('Coffee in Frequencies')).toHaveLength(2);
    expect(document.body.style.overflow).toBe('hidden');

    await user.click(screen.getByRole('button', { name: 'Cerrar selección' }));
    expect(addButton).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });

  it('recupera un carrito persistido y no habilita un pago inexistente por defecto', async () => {
    window.localStorage.setItem(
      'tueste:cart:v1',
      JSON.stringify([
        { productId: 'cafe-lote-000', qty: 2 },
        { productId: 'desconocido', qty: 4 },
      ]),
    );
    render(<Tienda />);

    expect(await screen.findByText('Café del Lote 000')).toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /Tu selección, 2 productos/ }));
    expect(screen.getAllByText('Café del Lote 000')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Compra próximamente' })).toBeDisabled();
    expect(screen.getByText(/checkout está desactivado/i)).toBeInTheDocument();
  });
});
