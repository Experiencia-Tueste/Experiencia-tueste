import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RADIO_DEMO_OPTIONS, RADIO_CHANNELS, TRACKS } from '@/features/audio';
import { useAudioPlayer } from '../useAudioPlayer';

/**
 * El hook crea su HTMLAudioElement en un effect. Capturamos la instancia
 * con un stub de Audio para poder disparar eventos (ended, timeupdate…)
 * y simulamos play/pause del media (jsdom no los implementa).
 */
let audioEl: HTMLAudioElement;

/** AudioContext mínimo para verificar creación, resume y cierre. */
class FakeAudioContext {
  state = 'suspended';
  destination = {};
  resume = vi.fn(() => Promise.resolve());
  close = vi.fn(() => Promise.resolve());
  createMediaElementSource = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));
  createAnalyser = vi.fn(() => ({
    fftSize: 0,
    smoothingTimeConstant: 0,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));
}

beforeEach(() => {
  audioEl = new Audio();
  vi.stubGlobal(
    'Audio',
    vi.fn(() => audioEl),
  );
  HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
  HTMLMediaElement.prototype.pause = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useAudioPlayer (ciclo de vida del navegador)', () => {
  it('inicia con la primera pista del catálogo, sin reproducir ni canal', () => {
    const { result } = renderHook(() => useAudioPlayer());

    expect(result.current.trackId).toBe(TRACKS[0].id);
    expect(result.current.playing).toBe(false);
    expect(result.current.channelId).toBeNull();
    expect(result.current.analyser).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('togglePlay reproduce y pausa el audio', async () => {
    const { result } = renderHook(() => useAudioPlayer());

    await act(async () => {
      result.current.togglePlay();
    });
    expect(result.current.playing).toBe(true);
    expect(audioEl.src).toContain(`/audio/01-origen-111-hz.mp3`);

    await act(async () => {
      result.current.togglePlay();
    });
    expect(result.current.playing).toBe(false);
  });

  it('togglePlay crea el grafo de audio en la primera interacción', async () => {
    const ctx = new FakeAudioContext();
    vi.stubGlobal(
      'AudioContext',
      vi.fn(() => ctx),
    );
    const { result } = renderHook(() => useAudioPlayer());

    await act(async () => {
      result.current.togglePlay();
    });

    expect(ctx.createMediaElementSource).toHaveBeenCalledWith(audioEl);
    expect(ctx.createAnalyser).toHaveBeenCalled();
    expect(result.current.analyser).not.toBeNull();
  });

  it('reanuda el contexto si quedó suspended al arrancar', async () => {
    const ctx = new FakeAudioContext();
    vi.stubGlobal(
      'AudioContext',
      vi.fn(() => ctx),
    );
    const { result } = renderHook(() => useAudioPlayer());

    await act(async () => {
      result.current.togglePlay();
    });

    expect(ctx.resume).toHaveBeenCalled();
  });

  it('elegir una señal desde pausado crea el grafo, inicia el audio y activa el canal', async () => {
    const ctx = new FakeAudioContext();
    vi.stubGlobal(
      'AudioContext',
      vi.fn(() => ctx),
    );
    const { result } = renderHook(() => useAudioPlayer());
    const cafe = RADIO_DEMO_OPTIONS.find((o) => o.id === 'cafe')!;

    await act(async () => {
      result.current.selectChannel(cafe);
    });

    expect(ctx.createAnalyser).toHaveBeenCalled();
    expect(result.current.analyser).not.toBeNull();
    expect(result.current.channelId).toBe('cafe');
    expect(result.current.playing).toBe(true);
    expect(result.current.trackId).toBe(RADIO_CHANNELS.find((c) => c.id === 'cafe')!.queue[0]);
  });

  it('sin AudioContext el MP3 sigue reproduciéndose sin visualizador', async () => {
    const { result } = renderHook(() => useAudioPlayer());

    await act(async () => {
      result.current.togglePlay();
    });

    expect(result.current.playing).toBe(true);
    expect(result.current.analyser).toBeNull();
  });

  it('select cambia la pista y desactiva el canal encadenado', async () => {
    const { result } = renderHook(() => useAudioPlayer());
    const cafe = RADIO_DEMO_OPTIONS.find((o) => o.id === 'cafe')!;

    await act(async () => {
      result.current.selectChannel(cafe);
    });
    expect(result.current.channelId).toBe('cafe');

    await act(async () => {
      result.current.select('despertar-528');
    });
    expect(result.current.trackId).toBe('despertar-528');
    expect(result.current.channelId).toBeNull();
  });

  it('selectChannel activa la señal y reproduce su primera pista', async () => {
    const { result } = renderHook(() => useAudioPlayer());
    const origen = RADIO_DEMO_OPTIONS.find((o) => o.id === 'origen')!;

    await act(async () => {
      result.current.selectChannel(origen);
    });

    expect(result.current.channelId).toBe('origen');
    expect(result.current.trackId).toBe(RADIO_CHANNELS.find((c) => c.id === 'origen')!.queue[0]);
    expect(result.current.playing).toBe(true);
  });

  it('selectChannel con «Escucha libre» desactiva el canal y la pista inicial sigue sonando', async () => {
    const { result } = renderHook(() => useAudioPlayer());
    const cafe = RADIO_DEMO_OPTIONS.find((o) => o.id === 'cafe')!;
    const libre = RADIO_DEMO_OPTIONS.find((o) => o.id === 'libre')!;

    await act(async () => {
      result.current.selectChannel(cafe);
    });
    await act(async () => {
      result.current.selectChannel(libre);
    });

    expect(result.current.channelId).toBeNull();
    expect(result.current.trackId).toBe(TRACKS[0].id);
    expect(result.current.playing).toBe(true);
  });

  it('al terminar una pista en canal, encadena la siguiente de la cola', async () => {
    const { result } = renderHook(() => useAudioPlayer());
    const cafe = RADIO_DEMO_OPTIONS.find((o) => o.id === 'cafe')!;
    const cola = RADIO_CHANNELS.find((c) => c.id === 'cafe')!.queue;

    await act(async () => {
      result.current.selectChannel(cafe);
    });
    expect(result.current.trackId).toBe(cola[0]);

    await act(async () => {
      audioEl.dispatchEvent(new Event('ended'));
    });
    expect(result.current.trackId).toBe(cola[1]);
    expect(result.current.playing).toBe(true);
  });

  it('el arranque automático de la siguiente pista asegura el grafo', async () => {
    const ctx = new FakeAudioContext();
    vi.stubGlobal(
      'AudioContext',
      vi.fn(() => ctx),
    );
    const { result } = renderHook(() => useAudioPlayer());
    const cafe = RADIO_DEMO_OPTIONS.find((o) => o.id === 'cafe')!;

    await act(async () => {
      result.current.selectChannel(cafe);
    });
    await act(async () => {
      audioEl.dispatchEvent(new Event('ended'));
    });

    expect(result.current.trackId).toBe(RADIO_CHANNELS.find((c) => c.id === 'cafe')!.queue[1]);
    expect(result.current.playing).toBe(true);
  });

  it('sin canal activa el fin de pista solo anuncia el final del preview', async () => {
    const { result } = renderHook(() => useAudioPlayer());

    await act(async () => {
      result.current.togglePlay();
    });
    await act(async () => {
      audioEl.dispatchEvent(new Event('ended'));
    });

    expect(result.current.trackId).toBe(TRACKS[0].id);
    expect(result.current.mensaje).toBe('Preview terminado.');
  });

  it('refleja el progreso del audio (timeupdate y loadedmetadata)', async () => {
    const { result } = renderHook(() => useAudioPlayer());

    Object.defineProperty(audioEl, 'duration', { value: 75.05, configurable: true });
    await act(async () => {
      audioEl.dispatchEvent(new Event('loadedmetadata'));
    });
    expect(result.current.duration).toBe(75.05);

    await act(async () => {
      audioEl.currentTime = 30;
      audioEl.dispatchEvent(new Event('timeupdate'));
    });
    expect(result.current.currentTime).toBe(30);
  });

  it('seek acota dentro de la ventana conocida', async () => {
    const { result } = renderHook(() => useAudioPlayer());

    Object.defineProperty(audioEl, 'duration', { value: 75.05, configurable: true });
    await act(async () => {
      result.current.seek(40);
    });

    expect(result.current.currentTime).toBe(40);
    expect(audioEl.currentTime).toBe(40);
  });

  it('sin duración conocida no produce NaN en el progreso', async () => {
    const { result } = renderHook(() => useAudioPlayer());

    await act(async () => {
      result.current.seek(10);
    });

    expect(Number.isNaN(result.current.currentTime)).toBe(false);
    expect(Number.isNaN(result.current.duration)).toBe(false);
    expect(result.current.currentTime).toBe(0);
    expect(result.current.duration).toBe(0);
  });

  it('si el navegador bloquea el play, expone el error y deja de reproducir', async () => {
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.reject(new Error('blocked')));
    const { result } = renderHook(() => useAudioPlayer());

    await act(async () => {
      result.current.togglePlay();
    });

    expect(result.current.playing).toBe(false);
    expect(result.current.error).toBe('El navegador bloqueó la reproducción.');
  });

  it('un error del media se refleja en el estado del reproductor', async () => {
    const { result } = renderHook(() => useAudioPlayer());

    await act(async () => {
      audioEl.dispatchEvent(new Event('error'));
    });

    expect(result.current.error).toBe('No se pudo cargar el audio.');
  });

  it('al desmontar desconecta source y analyser y cierra el AudioContext', async () => {
    const ctx = new FakeAudioContext();
    const source = { connect: vi.fn(), disconnect: vi.fn() };
    const analyser = {
      fftSize: 0,
      smoothingTimeConstant: 0,
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    ctx.createMediaElementSource.mockReturnValue(source);
    ctx.createAnalyser.mockReturnValue(analyser);
    vi.stubGlobal(
      'AudioContext',
      vi.fn(() => ctx),
    );
    const { result, unmount } = renderHook(() => useAudioPlayer());

    await act(async () => {
      result.current.togglePlay();
    });
    expect(result.current.analyser).not.toBeNull();

    unmount();

    expect(source.disconnect).toHaveBeenCalled();
    expect(analyser.disconnect).toHaveBeenCalled();
    expect(ctx.close).toHaveBeenCalled();
    expect(audioEl.pause).toHaveBeenCalled();
  });

  it('hasInteracted inicia en false y pasa a true al reproducir', async () => {
    const { result } = renderHook(() => useAudioPlayer());

    expect(result.current.hasInteracted).toBe(false);

    await act(async () => {
      result.current.togglePlay();
    });
    expect(result.current.hasInteracted).toBe(true);
  });

  it('hasInteracted pasa a true al seleccionar una pista', async () => {
    const { result } = renderHook(() => useAudioPlayer());

    await act(async () => {
      result.current.select(TRACKS[2].id);
    });

    expect(result.current.hasInteracted).toBe(true);
  });

  it('hasInteracted pasa a true al elegir un canal de Radio Origen', async () => {
    const { result } = renderHook(() => useAudioPlayer());
    const origen = RADIO_DEMO_OPTIONS.find((o) => o.id === 'origen')!;

    await act(async () => {
      result.current.selectChannel(origen);
    });

    expect(result.current.hasInteracted).toBe(true);
  });
});
