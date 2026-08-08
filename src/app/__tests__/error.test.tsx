import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ErrorPage from '../error';

/**
 * Pruebas del error boundary: mensaje seguro (sin detalles del error
 * original) y botón Reintentar que invoca `retry` una sola vez.
 */
describe('error (error boundary de ruta)', () => {
  it('muestra un mensaje genérico sin exponer el error original', () => {
    render(<ErrorPage error={new Error('detalle-secreto-interno')} retry={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Algo salió mal' })).toBeInTheDocument();
    expect(screen.getByText(/error inesperado/i)).toBeInTheDocument();
    expect(screen.queryByText(/detalle-secreto-interno/i)).not.toBeInTheDocument();
  });

  it('el botón Reintentar invoca retry exactamente una vez', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    render(<ErrorPage error={new Error('x')} retry={retry} />);

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
