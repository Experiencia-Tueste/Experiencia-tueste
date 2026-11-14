import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RADIO_DEMO_OPTIONS } from '@/features/audio';
import NegociosRadio from '../NegociosRadio';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('NegociosRadio (señal real)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('«Probar la Señal Café» activa el canal global correspondiente', async () => {
    const user = userEvent.setup();
    const onSelectChannel = vi.fn();
    render(<NegociosRadio onSelectChannel={onSelectChannel} />);

    await user.click(screen.getByRole('button', { name: 'Probar la Señal Café' }));

    expect(onSelectChannel).toHaveBeenCalledWith(
      RADIO_DEMO_OPTIONS.find((option) => option.id === 'cafe'),
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Señal Café activa en el reproductor y encadenando piezas.',
    );
  });

  it('recopila los datos B2B y exige consentimiento antes de enviar un plan', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ message: 'Recibimos tu solicitud.' }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);
    render(<NegociosRadio onSelectChannel={vi.fn()} />);

    await user.click(screen.getAllByRole('button', { name: 'Solicitar plan' })[0]);
    const send = screen.getByRole('button', { name: 'Enviar solicitud' });
    expect(send).toBeEnabled();
    await user.type(screen.getByRole('textbox', { name: 'Empresa *' }), 'Café Norte');
    await user.type(screen.getByRole('textbox', { name: 'Responsable *' }), 'Ana');
    await user.type(screen.getByRole('textbox', { name: 'Ciudad *' }), 'Bogotá');
    await user.type(screen.getByRole('textbox', { name: 'Tipo de negocio *' }), 'Café');
    await user.type(screen.getByRole('textbox', { name: 'Horario *' }), '8:00–18:00');
    await user.click(screen.getByRole('checkbox', { name: /evaluar la solicitud/i }));
    fireEvent.submit(send.closest('form')!);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const request = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(request).toMatchObject({
      type: 'radio',
      reference: 'senal',
      payload: {
        company: 'Café Norte',
        responsible: 'Ana',
        city: 'Bogotá',
        businessType: 'Café',
        locations: 1,
        hours: '8:00–18:00',
        consent: true,
      },
    });
  });
});
