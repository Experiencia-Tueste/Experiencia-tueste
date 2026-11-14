import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PendingAdoptionNotice from '../components/PendingAdoptionNotice';

const fetchMock = vi.fn();
const payUrl =
  'https://tueste.co/cart/51668810006816:12?attributes%5Bref-experiencia%5D=TT-0000000000000000';
const adoption = {
  treeNumber: '003',
  treeName: 'Aurora',
  treesCount: 12,
  insignia: 'Plata',
  payUrl,
};

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

describe('aviso de adopción pendiente', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('muestra la adopción pendiente con el enlace para completar el pago', async () => {
    respond(200, { adoption });

    render(<PendingAdoptionNotice />);

    expect(await screen.findByText('Tu adopción está pendiente de pago')).toBeInTheDocument();
    expect(
      screen.getByText('Aurora · árbol #003 · 12 árboles · Insignia Plata'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Completar pago/ })).toHaveAttribute('href', payUrl);
    expect(fetchMock).toHaveBeenCalledWith('/api/tree/adoption');
  });

  it('usa el singular con un solo árbol', async () => {
    respond(200, { adoption: { ...adoption, treesCount: 1, insignia: 'Semilla' } });

    render(<PendingAdoptionNotice />);

    expect(
      await screen.findByText('Aurora · árbol #003 · 1 árbol · Insignia Semilla'),
    ).toBeInTheDocument();
  });

  it('sin enlace de pago avisa que la tienda no está disponible', async () => {
    respond(200, { adoption: { ...adoption, payUrl: null } });

    render(<PendingAdoptionNotice />);

    expect(await screen.findByText(/La tienda no está disponible/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Completar pago/ })).not.toBeInTheDocument();
  });

  it.each([
    ['sin sesión', 401, { message: 'Inicia sesión para continuar.' }],
    ['sin adopción pendiente', 200, { adoption: null }],
    ['con el servicio caído', 503, { message: 'No pudimos consultar tu adopción.' }],
  ])('no muestra nada %s', async (_caso, status, body) => {
    respond(status, body);

    const { container } = render(<PendingAdoptionNotice />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('no muestra nada si la red falla', async () => {
    fetchMock.mockRejectedValue(new Error('sin red'));

    const { container } = render(<PendingAdoptionNotice />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
