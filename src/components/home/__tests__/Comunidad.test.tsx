import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Comunidad from '../Comunidad';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('Comunidad', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mantiene el CTA bloqueado hasta aceptar comunicaciones y envía preferencias', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/community/consent') {
        return Promise.resolve(new Response(JSON.stringify({ state: null }), { status: 200 }));
      }
      return Promise.resolve(
        new Response(JSON.stringify({ message: 'Recibimos tu solicitud.' }), { status: 200 }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<Comunidad />);

    const submit = screen.getByRole('button', { name: 'Unirme con mi cuenta' });
    expect(submit).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: 'events' }));
    await user.click(screen.getByRole('checkbox', { name: /recibir comunicaciones/i }));
    await user.click(submit);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const engagementCall = fetchMock.mock.calls.find(([url]) => url === '/api/engagements');
    const request = JSON.parse(engagementCall?.[1].body as string);
    expect(request).toMatchObject({
      type: 'community',
      reference: 'membership',
      payload: { preferences: ['general', 'events'], consent: true },
    });
  });
});
