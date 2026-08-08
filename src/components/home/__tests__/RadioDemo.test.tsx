import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RADIO_DEMO_OPTIONS, RADIO_CHANNELS } from '@/features/audio';
import RadioDemo from '../RadioDemo';

describe('RadioDemo (demo de radio por suscripción)', () => {
  const activos = () =>
    screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-pressed') === 'true')
      .map((b) => b.textContent);

  it('renderiza las seis opciones del contrato', () => {
    render(<RadioDemo channelId={null} onSelectChannel={vi.fn()} mensaje={null} />);

    expect(RADIO_DEMO_OPTIONS).toHaveLength(6);
    for (const option of RADIO_DEMO_OPTIONS) {
      expect(screen.getByRole('button', { name: option.label })).toBeInTheDocument();
    }
  });

  it('con channelId null hay exactamente un botón activo y es «Escucha libre»', () => {
    render(<RadioDemo channelId={null} onSelectChannel={vi.fn()} mensaje={null} />);

    expect(activos()).toEqual(['Escucha libre']);
  });

  it('con channelId «origen» solo esa opción queda activa', () => {
    render(<RadioDemo channelId="origen" onSelectChannel={vi.fn()} mensaje={null} />);

    expect(activos()).toEqual(['Señal Origen']);
  });

  it('al pulsar «Café» onSelectChannel recibe la opción del canal cafe', async () => {
    const user = userEvent.setup();
    const onSelectChannel = vi.fn();
    render(<RadioDemo channelId={null} onSelectChannel={onSelectChannel} mensaje={null} />);

    const cafe = RADIO_DEMO_OPTIONS.find((o) => o.id === 'cafe')!;
    await user.click(screen.getByRole('button', { name: 'Café' }));

    expect(onSelectChannel).toHaveBeenCalledWith(cafe);
    expect(onSelectChannel.mock.calls[0][0].channel).toBe('cafe');
    expect(onSelectChannel.mock.calls[0][0].channel).toBe(
      RADIO_CHANNELS.find((c) => c.id === 'cafe')!.id,
    );
  });

  it('anuncia el mensaje del reproductor en aria-live sin afirmar reproducción', () => {
    render(
      <RadioDemo
        channelId="origen"
        onSelectChannel={vi.fn()}
        mensaje="Señal «Señal Origen» activa en continuo."
      />,
    );

    const live = screen.getByRole('status');
    expect(live.textContent).toContain('Señal «Señal Origen» activa en continuo.');
    expect(live.textContent).not.toContain('reproduciendo');
  });

  it('el enlace de planes apunta solo al ancla #radio', () => {
    render(<RadioDemo channelId={null} onSelectChannel={vi.fn()} mensaje={null} />);

    const link = screen.getByRole('link', { name: /Planes desde USD 10\/mes/ });
    expect(link).toHaveAttribute('href', '#radio');
  });
});
