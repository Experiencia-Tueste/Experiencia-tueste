import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MAX_CART_QTY } from '@/features/commerce';
import CartDrawer from '../CartDrawer';

describe('CartDrawer', () => {
  it('deshabilita sumar al alcanzar el máximo centralizado', () => {
    render(
      <CartDrawer
        open
        items={[{ productId: 'cafe-lote-000', qty: MAX_CART_QTY }]}
        onClose={() => {}}
        onQty={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'Agregar uno de Café del Lote 000' })).toBeDisabled();
  });

  it('elimina un producto al reducirlo a cero', async () => {
    const user = userEvent.setup();
    let items = [{ productId: 'cafe-lote-000', qty: 1 }];
    const { rerender } = render(
      <CartDrawer
        open
        items={items}
        onClose={() => {}}
        onQty={(_, delta) => {
          if (delta === -1) items = [];
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Quitar uno de Café del Lote 000' }));
    rerender(<CartDrawer open items={items} onClose={() => {}} onQty={() => {}} />);
    expect(screen.getByText('Tu selección está vacía')).toBeInTheDocument();
  });

  it('ofrece continuar comprando sin depender del proveedor de pago', async () => {
    const onClose = () => {};
    const user = userEvent.setup();
    render(<CartDrawer open items={[]} onClose={onClose} onQty={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Continuar comprando' }));
    expect(screen.getByText('Tu selección está vacía')).toBeInTheDocument();
  });
});
