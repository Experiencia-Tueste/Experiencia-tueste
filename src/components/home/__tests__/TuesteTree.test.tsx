import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LOTE_FUNDADOR } from '@/features/adoption';
import TuesteTree from '../TuesteTree';

describe('TuesteTree (ilustración editorial del lote)', () => {
  it('la escena decorativa existe, es aria-hidden y no expone textos falsos', () => {
    const { container } = render(<TuesteTree />);

    const escena = container.querySelector('[data-lote]');
    expect(escena).not.toBeNull();
    expect(escena).toHaveAttribute('aria-hidden', 'true');
    expect(escena!.textContent).toBe('');
  });

  it('la composición incluye luna, capas de paisaje y cafetos', () => {
    const { container } = render(<TuesteTree />);

    expect(container.querySelector('[data-luna]')).not.toBeNull();
    expect(container.querySelectorAll('[data-capa]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-cafeto]').length).toBeGreaterThanOrEqual(20);
  });

  it('conserva la etiqueta del lote y las coordenadas del fundador', () => {
    render(<TuesteTree />);

    expect(screen.getByText(LOTE_FUNDADOR.nombre)).toBeInTheDocument();
    expect(
      screen.getByText(
        `${LOTE_FUNDADOR.coordenadas} · ${LOTE_FUNDADOR.ubicacion} · ${LOTE_FUNDADOR.altitud}`,
      ),
    ).toBeInTheDocument();
  });

  it('no elimina la interacción: activar árbol y ver el panel demo', async () => {
    const user = userEvent.setup();
    render(<TuesteTree />);

    await user.click(screen.getByRole('button', { name: /Activar mi árbol/ }));
    expect(screen.getByRole('heading', { name: 'Activa tu árbol' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Volver/ }));
    await user.click(screen.getByRole('button', { name: /Ver el panel del adoptante/ }));
    expect(screen.getByText(/Estado de tu árbol/)).toBeInTheDocument();
  });
});
