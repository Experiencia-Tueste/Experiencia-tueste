import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EVENTS } from '@/features/events';
import EventRow from '../EventRow';

describe('EventRow', () => {
  // Reloj fijo antes del evento: `isReservable` compara contra la fecha real y la suite caducaría.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2027-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('abre el formulario, exige consentimiento y envía la solicitud', async () => {
    const user = userEvent.setup();
    const onReserva = vi.fn().mockResolvedValue(undefined);
    const event = { ...EVENTS[1], dateTime: '2027-07-12', year: '2027' };

    render(<EventRow ev={event} onReserva={onReserva} />);

    await user.click(screen.getByRole('button', { name: 'Entradas' }));

    const submit = screen.getByRole('button', { name: 'Enviar solicitud' });
    expect(submit).toBeDisabled();
    expect(screen.getByRole('spinbutton', { name: 'Asistentes' })).toHaveFocus();

    await user.click(screen.getByRole('checkbox', { name: /Acepto que Tueste/i }));
    await user.click(submit);

    await waitFor(() =>
      expect(onReserva).toHaveBeenCalledWith(
        event,
        expect.objectContaining({ attendeeCount: 1, city: event.city, consent: true }),
      ),
    );
  });
});
