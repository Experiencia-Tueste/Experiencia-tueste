import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Origen from '../Origen';
import type { AudioPlayerResult } from '@/hooks/useAudioPlayer';

/**
 * Pruebas de interacción de las cinco tarjetas del proceso del origen:
 * cada tarjeta controla su melodía exclusivamente a través del
 * reproductor GLOBAL (mockeado aquí), sin <audio> ni AudioContext
 * propios.
 */

vi.mock('next/image', () => ({
  default: (props: { src: string; alt?: string }) =>
    createElement('img', { src: props.src, alt: props.alt ?? '' }),
}));

function createMockPlayer(overrides: Partial<AudioPlayerResult> = {}): AudioPlayerResult {
  return {
    trackId: 'origen-111',
    playing: false,
    loading: false,
    error: null,
    currentTime: 0,
    duration: 0,
    channelId: null,
    analyser: null,
    mensaje: null,
    hasInteracted: false,
    togglePlay: vi.fn(),
    select: vi.fn(),
    play: vi.fn(),
    seek: vi.fn(),
    selectChannel: vi.fn(),
    ...overrides,
  } as AudioPlayerResult;
}

function renderOrigen(player: AudioPlayerResult) {
  return render(<Origen player={player} />);
}

describe('Origen (cada tarjeta controla su melodía)', () => {
  it('activar una tarjeta distinta reproduce su pista desde el comienzo', async () => {
    const user = userEvent.setup();
    const player = createMockPlayer({ trackId: 'origen-111', playing: false });
    renderOrigen(player);

    await user.click(screen.getByRole('button', { name: /Reproducir Raíz · Raíz 222 Hz/ }));

    expect(player.play).toHaveBeenCalledWith('raiz-222');
    expect(player.togglePlay).not.toHaveBeenCalled();
  });

  it('activar la tarjeta que está sonando la pausa', async () => {
    const user = userEvent.setup();
    const player = createMockPlayer({ trackId: 'expansion-432', playing: true });
    renderOrigen(player);

    await user.click(screen.getByRole('button', { name: /Pausar Expansión · Expansión 432 Hz/ }));

    expect(player.togglePlay).toHaveBeenCalledTimes(1);
    expect(player.play).not.toHaveBeenCalled();
  });

  it('activar la tarjeta seleccionada pero pausada la reanuda', async () => {
    const user = userEvent.setup();
    const player = createMockPlayer({ trackId: 'despertar-528', playing: false });
    renderOrigen(player);

    await user.click(
      screen.getByRole('button', { name: /Reproducir Despertar · Despertar 528 Hz/ }),
    );

    expect(player.togglePlay).toHaveBeenCalledTimes(1);
    expect(player.play).not.toHaveBeenCalled();
  });

  it('el control visible y aria-pressed reflejan el estado del reproductor global', () => {
    const player = createMockPlayer({ trackId: 'coherencia-432', playing: true });
    renderOrigen(player);

    // Tostión suena: Pausar + pressed.
    const tostion = screen.getByRole('button', {
      name: /Pausar Tostión · Coherencia 432 Hz/,
    });
    expect(tostion).toHaveAttribute('aria-pressed', 'true');
    expect(tostion).toHaveTextContent('Pausar');

    // Germinación está seleccionada en el reproductor (trackId) pero no suena.
    const germinacion = screen.getByRole('button', {
      name: /Reproducir Germinación · Origen 111 Hz/,
    });
    expect(germinacion).toHaveAttribute('aria-pressed', 'false');
    expect(germinacion).toHaveTextContent('Reproducir');
  });

  it('la tarjeta se presenta como un único botón accesible sin controles anidados', () => {
    const player = createMockPlayer();
    const { container } = renderOrigen(player);

    const tarjetas = Array.from(container.querySelectorAll('#origen button[aria-pressed]'));
    expect(tarjetas).toHaveLength(5);
    for (const tarjeta of tarjetas) {
      // La tarjeta completa es el control: no puede contener botones.
      expect(tarjeta.querySelector('button')).toBeNull();
      expect(tarjeta.getAttribute('aria-pressed')).toBe('false');
    }
  });

  it('clic sobre cualquier parte de la tarjeta dispara la acción de esa etapa', async () => {
    const user = userEvent.setup();
    const player = createMockPlayer({ trackId: 'origen-111', playing: false });
    const { container } = renderOrigen(player);

    const tarjeta = container.querySelector('button[aria-label*="Germinación"]') as HTMLElement;
    // Clic en la zona inferior de la tarjeta (no en un control específico).
    await user.click(tarjeta);

    // Es la tarjeta activa (trackId coincide) pero está pausada: reanuda.
    expect(player.togglePlay).toHaveBeenCalledTimes(1);
  });

  it('mapea cada etapa con su pista del catálogo', () => {
    const player = createMockPlayer();
    renderOrigen(player);

    const pares: ReadonlyArray<[string, string]> = [
      ['Germinación', 'Origen 111 Hz'],
      ['Raíz', 'Raíz 222 Hz'],
      ['Expansión', 'Expansión 432 Hz'],
      ['Tostión', 'Coherencia 432 Hz'],
      ['Despertar', 'Despertar 528 Hz'],
    ];

    for (const [etapa, pista] of pares) {
      expect(
        screen.getByRole('button', { name: new RegExp(`Reproducir ${etapa} · ${pista}`) }),
      ).toBeInTheDocument();
    }
  });

  it('la tarjeta activa sincroniza el nombre de pista con el catálogo', () => {
    const player = createMockPlayer({ trackId: 'coherencia-432', playing: true });
    renderOrigen(player);

    const tostion = screen.getByRole('button', {
      name: /Pausar Tostión · Coherencia 432 Hz/,
    });
    expect(tostion).toHaveTextContent('432 Hz');
  });
});
