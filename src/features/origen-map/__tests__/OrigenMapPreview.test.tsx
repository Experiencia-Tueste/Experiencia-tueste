import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OrigenMapPreview from '../components/OrigenMapPreview';
import { getPuntoMapa } from '../data/puntos';

const maplibre = vi.hoisted(() => ({
  Map: vi.fn(),
  Marker: vi.fn(),
  NavigationControl: vi.fn(),
}));

vi.mock('maplibre-gl', () => maplibre);

const SOURCE = readFileSync(resolve(__dirname, '../components/OrigenMapPreview.tsx'), 'utf-8');
const finca = getPuntoMapa('finca-tres-esquinas')!;

let listeners: Partial<Record<'load' | 'style.load' | 'error', () => void>>;
let removeSpy: ReturnType<typeof vi.fn>;
let addControlSpy: ReturnType<typeof vi.fn>;

function enableWebGL2() {
  vi.stubGlobal('WebGL2RenderingContext', class WebGL2RenderingContext {});
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as never);
}

function renderPreview() {
  return render(<OrigenMapPreview punto={finca} etiqueta="Ubicación aproximada · demostración" />);
}

async function waitForMap() {
  await waitFor(() => {
    expect(maplibre.Map).toHaveBeenCalledTimes(1);
  });
}

function fallback() {
  return screen.getByText('Finca Tres Esquinas').closest('[data-origen-map-fallback]');
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_MAPTILER_KEY', 'public-test-key');
  listeners = {};
  removeSpy = vi.fn();
  addControlSpy = vi.fn();

  const mapInstance = {
    addControl: addControlSpy,
    on: vi.fn((event: string, listener: () => void) => {
      if (event === 'load' || event === 'style.load' || event === 'error') {
        listeners[event] = listener;
      }
    }),
    remove: removeSpy,
  };
  const marker = {
    addTo: vi.fn(),
    setLngLat: vi.fn(),
  };
  marker.setLngLat.mockReturnValue(marker);

  maplibre.Map.mockReset();
  maplibre.Marker.mockReset();
  maplibre.NavigationControl.mockReset();
  maplibre.Map.mockImplementation(() => mapInstance);
  maplibre.Marker.mockImplementation(() => marker);
  maplibre.NavigationControl.mockImplementation(() => ({}));
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('OrigenMapPreview (mini-mapas provisionales)', () => {
  it('sin WebGL2 no crea MapLibre y conserva el fallback visible', async () => {
    vi.stubGlobal('WebGL2RenderingContext', undefined);

    renderPreview();
    await act(async () => {});

    expect(maplibre.Map).not.toHaveBeenCalled();
    expect(fallback()).not.toHaveAttribute('aria-hidden');
  });

  it('antes de load mantiene el fallback por encima del mapa', async () => {
    enableWebGL2();
    renderPreview();
    await waitForMap();

    expect(fallback()).not.toHaveAttribute('aria-hidden');
    expect(screen.queryByText('Ubicación aproximada · demostración')).not.toBeInTheDocument();
  });

  it('tras load oculta visualmente el fallback y muestra la etiqueta editorial', async () => {
    enableWebGL2();
    renderPreview();
    await waitForMap();

    await act(async () => {
      listeners.load?.();
    });

    expect(fallback()).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Ubicación aproximada · demostración')).toBeInTheDocument();
  });

  it('tras style.load muestra el mapa sin esperar todos los tiles', async () => {
    enableWebGL2();
    renderPreview();
    await waitForMap();

    await act(async () => {
      listeners['style.load']?.();
    });

    expect(fallback()).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Ubicación aproximada · demostración')).toBeInTheDocument();
  });

  it('un error asíncrono antes de load conserva el fallback y limpia esa instancia', async () => {
    enableWebGL2();
    renderPreview();
    await waitForMap();

    await act(async () => {
      listeners.error?.();
    });

    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(fallback()).not.toHaveAttribute('aria-hidden');
    expect(screen.queryByText('Ubicación aproximada · demostración')).not.toBeInTheDocument();
  });

  it('un error de tile después de load no destruye un mapa ya usable', async () => {
    enableWebGL2();
    renderPreview();
    await waitForMap();

    await act(async () => {
      listeners.load?.();
      listeners.error?.();
    });

    expect(removeSpy).not.toHaveBeenCalled();
    expect(screen.getByText('Ubicación aproximada · demostración')).toBeInTheDocument();
  });

  it('desmonta la instancia una sola vez', async () => {
    enableWebGL2();
    const { unmount } = renderPreview();
    await waitForMap();

    unmount();

    expect(removeSpy).toHaveBeenCalledTimes(1);
  });

  it('mantiene la región del mapa accesible y sin aria-hidden', () => {
    renderPreview();

    const region = screen.getByRole('region', {
      name: /Mapa interactivo provisional: Finca Tres Esquinas/i,
    });
    expect(region).not.toHaveAttribute('aria-hidden');
    expect(region.closest('[aria-hidden="true"]')).toBeNull();
  });

  it('usa MapTiler y el punto local del contrato', async () => {
    enableWebGL2();
    renderPreview();
    await waitForMap();

    const options = maplibre.Map.mock.calls[0]?.[0] as {
      center: [number, number];
      dragRotate: boolean;
      pitchWithRotate: boolean;
      style: { sources: { maptiler: { tiles: string[] } } };
    };
    expect(options.style.sources.maptiler.tiles).toEqual([
      'https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png?key=public-test-key',
    ]);
    expect(options.center).toEqual([-75.6667, 4.5333]);
    expect(options.dragRotate).toBe(false);
    expect(options.pitchWithRotate).toBe(false);
  });

  it('no contiene endpoints propios, secretos ni fuentes de divergencia SSR', () => {
    const code = SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

    for (const forbidden of [
      'fetch(',
      'process.env',
      'Math.random(',
      'Date.now(',
      'new Date(',
      'localStorage',
      'suppressHydrationWarning',
    ]) {
      expect(code).not.toContain(forbidden);
    }
  });
});
