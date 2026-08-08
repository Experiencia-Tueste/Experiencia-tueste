import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Deck, { IDLE_WAVE } from '../Deck';

const baseProps = {
  track: undefined,
  playing: false,
  loading: false,
  analyser: null,
  hasInteracted: false,
  onTogglePlay: vi.fn(),
};

/** AnalyserNode mínimo para el ciclo del visualizador. */
function mockAnalyser() {
  return {
    frequencyBinCount: 128,
    getByteFrequencyData: vi.fn((data: Uint8Array) => {
      data.fill(128);
    }),
  } as unknown as AnalyserNode;
}

/** Contexto 2D mínimo (jsdom no implementa canvas). */
function mockCtx() {
  return {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    lineWidth: 1,
    lineCap: 'round',
    globalAlpha: 1,
    strokeStyle: '',
    fillStyle: '',
  };
}

let ctx: ReturnType<typeof mockCtx>;
let raf: ReturnType<typeof vi.fn>;
let caf: ReturnType<typeof vi.fn>;

beforeEach(() => {
  ctx = mockCtx();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  );
  // El stub ejecuta el callback solo la primera vez (el tick relanza rAF).
  let calls = 0;
  raf = vi.fn((cb: FrameRequestCallback) => {
    calls += 1;
    if (calls === 1) cb(0);
    return calls;
  });
  caf = vi.fn();
  vi.stubGlobal('requestAnimationFrame', raf);
  vi.stubGlobal('cancelAnimationFrame', caf);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete (HTMLCanvasElement.prototype as { clientWidth?: unknown }).clientWidth;
  delete (HTMLCanvasElement.prototype as { clientHeight?: unknown }).clientHeight;
});

describe('Deck (visualizador del reproductor en canvas)', () => {
  it('mantiene el canvas del visualizador y el botón play accesible', () => {
    const { container } = render(<Deck {...baseProps} />);

    const canvas = container.querySelector('[data-deck-canvas]');
    expect(canvas).not.toBeNull();
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
    expect(
      screen.getByRole('button', { name: 'Reproducir pista seleccionada' }),
    ).toBeInTheDocument();
    expect(screen.getByText('— Hz · esperando señal')).toBeInTheDocument();
    expect(screen.getByText('EN VIVO')).toBeInTheDocument();
  });

  it('sin analyser mantiene el ciclo idle con rAF (deck vivo, no congelado)', () => {
    render(<Deck {...baseProps} />);

    expect(raf).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalled();
  });

  it('limpia el canvas con coordenadas reales (transform identidad)', () => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 800,
    });
    Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', {
      configurable: true,
      get: () => 400,
    });

    render(<Deck {...baseProps} />);

    // El buffer físico es 800×400 (dpr=1): la limpieza usa esas medidas
    // reales, no el espacio lógico 400×400.
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 400);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('se redibuja al redimensionar la ventana (siguiente frame del loop)', () => {
    // Stub con ejecución manual: el tick solo corre cuando el test lo pide,
    // permitiendo intercalar el resize entre dos frames.
    const pending: { cb: FrameRequestCallback | null } = { cb: null };
    raf = vi.fn((cb: FrameRequestCallback) => {
      pending.cb = cb;
      return 1;
    });
    vi.stubGlobal('requestAnimationFrame', raf);

    render(<Deck {...baseProps} />);
    pending.cb?.(0); // tick 1: dibujo inicial
    expect(ctx.clearRect).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('resize')); // re-aplica la transformación

    pending.cb?.(0); // tick 2: repinta con la nueva transformación
    expect(ctx.clearRect).toHaveBeenCalledTimes(2);
    // applyTransform + identidad (clearReal) de cada draw, más la
    // re-aplicación del resize.
    expect(ctx.setTransform).toHaveBeenCalledTimes(4);
  });

  it('en canvas cuadrado escala el espacio 400×400 sin desplazamiento', () => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 1366,
    });
    Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', {
      configurable: true,
      get: () => 1366,
    });

    render(<Deck {...baseProps} />);

    // dpr=1 en jsdom: scale = 1366/400 = 3.415, offsets 0.
    expect(ctx.setTransform).toHaveBeenCalledWith(3.415, 0, 0, 3.415, 0, 0);
  });

  it('en canvas rectangular centra el dibujo con offset (el aro no queda en la esquina)', () => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 800,
    });
    Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', {
      configurable: true,
      get: () => 400,
    });

    render(<Deck {...baseProps} />);

    // scale = min(800, 400)/400 = 1; offsetX = (800 - 400)/2 = 200; offsetY = 0.
    expect(ctx.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 200, 0);
  });

  it('con analyser y reproduciendo arranca el ciclo de frames', () => {
    const analyser = mockAnalyser();
    render(<Deck {...baseProps} playing analyser={analyser} />);

    expect(raf).toHaveBeenCalled();
    // El primer frame se ejecutó: el analyser fue leído y el canvas dibujado.
    expect(analyser.getByteFrequencyData).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
  });

  it('las barras animadas nunca escapan del alcance del Master (máx 228)', () => {
    const analyser = {
      frequencyBinCount: 128,
      getByteFrequencyData: vi.fn((data: Uint8Array) => data.fill(255)),
    } as unknown as AnalyserNode;
    render(<Deck {...baseProps} playing analyser={analyser} />);

    // Con datos al máximo: len = 42 + 126 = 168, extremo = 60 + 168 = 228
    // (R·0.5 + R·0.35 + R·1.05 del Master). Las puntas se recortan en el
    // borde del deck (overflow hidden), como en la referencia.
    const extremos = ctx.lineTo.mock.calls as Array<[number, number]>;
    expect(extremos).toHaveLength(64);
    for (const [x, y] of extremos) {
      expect(Math.hypot(x - 200, y - 200)).toBeLessThanOrEqual(228.01);
    }
  });

  it('dibuja cada barra con gradiente teal→amber→coral', () => {
    render(<Deck {...baseProps} />);

    expect(ctx.createLinearGradient).toHaveBeenCalledTimes(64);
    const grad = ctx.createLinearGradient.mock.results[0]?.value as {
      addColorStop: ReturnType<typeof vi.fn>;
    };
    expect(grad.addColorStop).toHaveBeenCalledWith(0, '#19c9b8');
    expect(grad.addColorStop).toHaveBeenCalledWith(0.6, '#fba922');
    expect(grad.addColorStop).toHaveBeenCalledWith(1, '#ff6f86');
  });

  it('dibuja el núcleo solar con gradiente radial y los 3 anillos orgánicos', () => {
    render(<Deck {...baseProps} />);

    expect(ctx.createRadialGradient).toHaveBeenCalledTimes(1);
    const core = ctx.createRadialGradient.mock.results[0]?.value as {
      addColorStop: ReturnType<typeof vi.fn>;
    };
    // Reposo: ámbar atenuado "55" → coral "22" → transparente.
    expect(core.addColorStop).toHaveBeenCalledWith(0, 'rgba(251, 169, 34, 0.33)');
    expect(core.addColorStop).toHaveBeenCalledWith(0.7, 'rgba(255, 111, 134, 0.13)');
    expect(core.addColorStop).toHaveBeenCalledWith(1, 'transparent');
    // 3 anillos orgánicos + núcleo + (sin playing) sin pulso = 4 arcos.
    expect(ctx.arc).toHaveBeenCalledTimes(4);
  });

  it('al sonar enciende el núcleo y añade el pulso de brillo', () => {
    const analyser = mockAnalyser();
    render(<Deck {...baseProps} playing analyser={analyser} />);

    const core = ctx.createRadialGradient.mock.results[0]?.value as {
      addColorStop: ReturnType<typeof vi.fn>;
    };
    // Sonando: ámbar pleno "cc".
    expect(core.addColorStop).toHaveBeenCalledWith(0, 'rgba(251, 169, 34, 0.8)');
    // 3 anillos + núcleo + pulso = 5 arcos.
    expect(ctx.arc).toHaveBeenCalledTimes(5);
  });

  it('marca el contenedor como isPlaying mientras suena', () => {
    const { container, rerender } = render(<Deck {...baseProps} />);
    const deck = container.firstChild as HTMLElement | null;
    // Los CSS modules se hashean en los tests (_isPlaying_xxxx): se
    // verifica el nombre de clase por substring.
    expect(deck?.className).not.toContain('isPlaying');

    rerender(<Deck {...baseProps} playing />);
    expect(deck?.className).toContain('isPlaying');
  });

  it('pausar cambia al ciclo idle: cancela el frame anterior y relanza sin analizar', () => {
    const analyser = mockAnalyser();
    const { rerender } = render(<Deck {...baseProps} playing analyser={analyser} />);
    // 1 del arranque del effect + 1 del relanzamiento dentro del tick.
    expect(raf).toHaveBeenCalledTimes(2);
    expect(analyser.getByteFrequencyData).toHaveBeenCalled();

    rerender(<Deck {...baseProps} playing={false} analyser={analyser} />);

    // El ciclo no muere al pausar: se cancela el frame anterior y arranca
    // el loop idle (el stub solo ejecuta el primer callback de cada effect).
    expect(caf).toHaveBeenCalled();
    expect(raf).toHaveBeenCalledTimes(3);
    expect(analyser.getByteFrequencyData).toHaveBeenCalledTimes(1);
  });

  it('sin analyser arranca igualmente el ciclo idle aunque playing sea true', () => {
    render(<Deck {...baseProps} playing />);

    expect(raf).toHaveBeenCalled();
  });

  it('con prefers-reduced-motion activo no arranca el ciclo', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    );
    render(<Deck {...baseProps} playing analyser={mockAnalyser()} />);

    expect(raf).not.toHaveBeenCalled();
  });

  it('sin soporte de canvas no rompe el render ni la reproducción', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    const { container } = render(<Deck {...baseProps} playing analyser={mockAnalyser()} />);

    expect(container.querySelector('[data-deck-canvas]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Pausar pista' })).toBeInTheDocument();
  });

  it('alterna el botón a pausa mientras reproduce', () => {
    render(<Deck {...baseProps} playing />);

    expect(screen.getByRole('button', { name: 'Pausar pista' })).toBeInTheDocument();
  });

  it('desactiva el botón y muestra spinner mientras carga', () => {
    render(<Deck {...baseProps} loading />);

    const boton = screen.getByRole('button', { name: 'Cargando audio' });
    expect(boton).toBeDisabled();
  });

  it('dispara onTogglePlay al pulsar el botón central', async () => {
    const user = userEvent.setup();
    const onTogglePlay = vi.fn();
    render(<Deck {...baseProps} onTogglePlay={onTogglePlay} />);

    await user.click(screen.getByRole('button', { name: 'Reproducir pista seleccionada' }));

    expect(onTogglePlay).toHaveBeenCalledTimes(1);
  });

  it('muestra la frecuencia y el título de la pista seleccionada', () => {
    render(
      <Deck
        {...baseProps}
        hasInteracted
        track={{
          id: 'despertar-528',
          title: 'Despertar 528 Hz',
          description: 'Transformación',
          hz: 528,
          mode: 'house',
          src: '/audio/05-despertar-528-hz.mp3',
          duration: 75.05,
        }}
      />,
    );

    expect(screen.getByText('528 Hz · organic house')).toBeInTheDocument();
  });

  it('sin interacción muestra «— Hz · esperando señal» aunque haya pista', () => {
    render(
      <Deck
        {...baseProps}
        track={{
          id: 'origen-111',
          title: 'Origen 111 Hz',
          description: 'Paisaje sonoro',
          hz: 111,
          mode: 'ambient',
          src: '/audio/01-origen-111-hz.mp3',
          duration: 75.05,
        }}
      />,
    );

    expect(screen.getByText('— Hz · esperando señal')).toBeInTheDocument();
    expect(screen.queryByText(/Origen 111 Hz/)).not.toBeInTheDocument();
  });

  it('tras interacción con pista ambient muestra «paisaje sonoro»', () => {
    render(
      <Deck
        {...baseProps}
        hasInteracted
        track={{
          id: 'origen-111',
          title: 'Origen 111 Hz',
          description: 'Paisaje sonoro',
          hz: 111,
          mode: 'ambient',
          src: '/audio/01-origen-111-hz.mp3',
          duration: 75.05,
        }}
      />,
    );

    expect(screen.getByText('111 Hz · paisaje sonoro')).toBeInTheDocument();
    expect(screen.queryByText(/Origen 111 Hz/)).not.toBeInTheDocument();
  });

  it('tras interacción con una pista house muestra «organic house»', () => {
    render(
      <Deck
        {...baseProps}
        hasInteracted
        track={{
          id: 'expansion-432',
          title: 'Expansión 432 Hz',
          description: 'Organic house',
          hz: 432,
          mode: 'house',
          src: '/audio/03-expansion-432-hz.mp3',
          duration: 75.05,
        }}
      />,
    );

    expect(screen.getByText('432 Hz · organic house')).toBeInTheDocument();
  });

  it('IDLE_WAVE tiene 256 valores entre 0.04 y 0.22', () => {
    expect(IDLE_WAVE).toHaveLength(256);
    for (const v of IDLE_WAVE) {
      expect(v).toBeGreaterThanOrEqual(0.04);
      expect(v).toBeLessThanOrEqual(0.22);
    }
  });

  it('el render idle usa la onda IDLE_WAVE (longitudes variadas)', () => {
    render(<Deck {...baseProps} />);

    // Reposo: extremos entre 60 + 42 + 0.04·126 ≈ 107 y 60 + 42 + 0.22·126 ≈ 130.
    const extremos = ctx.lineTo.mock.calls as Array<[number, number]>;
    expect(extremos).toHaveLength(64);
    const distancias = extremos.map(([x, y]) => Math.hypot(x - 200, y - 200));
    for (const d of distancias) {
      // Tolerancia de coma flotante sobre los extremos teóricos (107.04–129.72).
      expect(d).toBeGreaterThanOrEqual(107.03);
      expect(d).toBeLessThanOrEqual(129.73);
    }
    // El patrón es irregular: no todas las barras miden lo mismo.
    expect(new Set(distancias.map((d) => d.toFixed(2))).size).toBeGreaterThan(1);
  });

  it('dos frames idle consecutivos producen datos de barra diferentes', () => {
    // Stub que ejecuta el callback dos veces (dos frames del loop idle).
    let calls = 0;
    raf = vi.fn((cb: FrameRequestCallback) => {
      calls += 1;
      if (calls <= 2) cb(0);
      return calls;
    });
    vi.stubGlobal('requestAnimationFrame', raf);

    render(<Deck {...baseProps} />);

    const extremos = ctx.lineTo.mock.calls as Array<[number, number]>;
    expect(extremos).toHaveLength(128); // 2 frames × 64 barras
    const frame1 = extremos.slice(0, 64).map(([x, y]) => Math.hypot(x - 200, y - 200));
    const frame2 = extremos.slice(64).map(([x, y]) => Math.hypot(x - 200, y - 200));
    // La onda avanza: al menos una barra cambia de longitud entre frames.
    expect(frame1.some((d, i) => Math.abs(d - frame2[i]) > 0.01)).toBe(true);
  });

  it('el loop idle usa requestAnimationFrame sin reduced-motion', () => {
    render(<Deck {...baseProps} />);

    expect(raf).toHaveBeenCalled();
  });

  it('con reduced-motion dibuja un solo frame estático y no programa loop', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    );
    render(<Deck {...baseProps} />);

    expect(raf).not.toHaveBeenCalled();
    // El frame estático sí se dibujó (64 barras idle en frame 0).
    expect(ctx.lineTo).toHaveBeenCalledTimes(64);
  });

  it('mantiene la nitidez del canvas con devicePixelRatio = 2', () => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 2 });
    Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 400,
    });
    Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', {
      configurable: true,
      get: () => 400,
    });

    render(<Deck {...baseProps} />);

    // Buffer físico 800×800 (400 CSS × dpr 2) y transformación lógica
    // 400×400 escalada por dpr: el dibujo queda nítido en pantallas retina.
    const canvas = document.querySelector('[data-deck-canvas]') as HTMLCanvasElement;
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(800);
    expect(ctx.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
  });

  it('ResizeObserver se simula sin warnings y se desconecta al desmontar', () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    class FakeResizeObserver {
      observe = observe;
      disconnect = disconnect;
    }
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);

    const { unmount } = render(<Deck {...baseProps} />);
    expect(observe).toHaveBeenCalledTimes(1);

    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
