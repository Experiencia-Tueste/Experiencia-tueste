import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MercadoOrigen from '../MercadoOrigen';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('MercadoOrigen', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('envía una solicitud de vendedor con consentimiento explícito', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ message: 'Recibimos tu solicitud.' }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    render(<MercadoOrigen />);
    await user.type(screen.getByRole('textbox', { name: 'Marca o finca *' }), 'Finca Roble');
    await user.type(screen.getByRole('textbox', { name: 'Responsable *' }), 'Luis');
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Tipo de producto *' }),
      'Café tostado',
    );
    await user.type(screen.getByRole('textbox', { name: 'Origen / región *' }), 'Quindío');
    await user.type(screen.getByRole('textbox', { name: 'Precio (COP) *' }), '48000');
    await user.click(screen.getByRole('checkbox', { name: /solicitud no genera cobro/i }));
    fireEvent.submit(
      screen.getByRole('button', { name: 'Solicitar publicación' }).closest('form')!,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const request = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(request).toMatchObject({
      type: 'market',
      reference: 'seller-onboarding',
      payload: {
        intent: 'seller_application',
        brand: 'Finca Roble',
        responsible: 'Luis',
        region: 'Quindío',
        category: 'Café tostado',
        priceCop: 48000,
        consent: true,
      },
    });
  });
});
