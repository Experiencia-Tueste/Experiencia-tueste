import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AudioPlayerResult } from '@/hooks/useAudioPlayer';
import AudioPlayer from '../AudioPlayer';

function mockPlayer(overrides: Partial<AudioPlayerResult> = {}): AudioPlayerResult {
  return {
    trackId: 'origen-111',
    playing: false,
    loading: false,
    error: null,
    currentTime: 0,
    duration: 75.05,
    channelId: null,
    analyser: null,
    mensaje: null,
    hasInteracted: false,
    togglePlay: vi.fn(),
    select: vi.fn(),
    seek: vi.fn(),
    selectChannel: vi.fn(),
    play: vi.fn(),
    ...overrides,
  };
}

describe('AudioPlayer (orden del master: lista → nota → demo → scrub → live)', () => {
  it('mantiene el orden DOM del mockup', () => {
    const { container } = render(<AudioPlayer player={mockPlayer()} />);

    const sigueA = (a: Element, b: Element) =>
      (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

    const tracklist = container.querySelector('[data-tracklist]')!;
    const nota = container.querySelector('[data-note]')!;
    const demo = container.querySelector('[data-radiodemo]')!;
    const scrub = container.querySelector('[data-scrub]')!;
    const live = container.querySelector('[data-live]')!;

    expect(sigueA(tracklist, nota)).toBe(true);
    expect(sigueA(nota, demo)).toBe(true);
    expect(sigueA(demo, scrub)).toBe(true);
    expect(sigueA(scrub, live)).toBe(true);
  });

  it('la nota de 75 s enlaza a la discografía (#lanzamientos)', () => {
    const { container } = render(<AudioPlayer player={mockPlayer()} />);

    const enlace = container.querySelector('[data-note] a');
    expect(enlace).not.toBeNull();
    expect(enlace).toHaveAttribute('href', '#lanzamientos');
  });

  it('el scrub es un input range accesible con el progreso de la pista', () => {
    const { container } = render(
      <AudioPlayer player={mockPlayer({ currentTime: 37.5, duration: 75.05 })} />,
    );

    const range = container.querySelector('[data-scrub] input[type="range"]');
    expect(range).not.toBeNull();
    expect(range).toHaveAttribute('aria-label', 'Progreso de la pista');
    expect(range).toHaveAttribute('max', '75.05');
  });

  it('anuncia el error del reproductor en el área aria-live', () => {
    render(<AudioPlayer player={mockPlayer({ error: 'No se pudo cargar el audio.' })} />);

    const live = document.querySelector('[data-live]');
    expect(live?.textContent).toContain('No se pudo cargar el audio.');
  });

  it('sin duración conocida no muestra NaN en el progreso', () => {
    render(<AudioPlayer player={mockPlayer({ currentTime: 0, duration: 0 })} />);

    const scrub = document.querySelector('[data-scrub]');
    const texto = scrub?.textContent ?? '';
    expect(texto).not.toContain('NaN');
    expect(texto).toContain('0:00');
    expect(texto).toContain('—');
  });
});
