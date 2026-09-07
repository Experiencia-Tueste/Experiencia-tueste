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
    window.history.replaceState({}, '', '/');
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

  it('filtra el catálogo público y abre un detalle reproducible', async () => {
    const user = userEvent.setup();
    const listings = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        slug: 'cafe-roble-11111111',
        title: 'Café Roble',
        vendorName: 'Finca Roble',
        brand: 'Marca Roble',
        category: 'Café tostado',
        variety: 'Castillo',
        process: 'Lavado',
        origin: 'Quindío',
        presentation: 'Bolsa 340 g',
        weightGrams: 340,
        inventory: 4,
        priceCents: 4800000,
        imageUrl: null,
        delivery: 'Envío nacional',
        traceability: 'Lote 001',
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        slug: 'cafe-campo-22222222',
        title: 'Café Campo',
        vendorName: 'Finca Campo',
        brand: 'Marca Campo',
        category: 'Café molido',
        variety: 'Caturra',
        process: 'Honey',
        origin: 'Huila',
        presentation: 'Bolsa 500 g',
        weightGrams: 500,
        inventory: 4,
        priceCents: 5000000,
        imageUrl: null,
        delivery: 'Envío nacional',
        traceability: 'Lote 002',
      },
    ];

    render(<MercadoOrigen listings={listings} />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Origen' }), 'Huila');

    expect(screen.getByText('Café Campo')).toBeInTheDocument();
    expect(screen.queryByText('Café Roble')).not.toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Ver detalle' }));
    expect(window.location.search).toBe(`?mercado=${listings[1].id}`);
    expect(screen.getByText('Detalle público')).toBeInTheDocument();
  });
});
