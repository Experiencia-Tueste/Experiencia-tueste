/**
 * Setup global de Vitest.
 *
 * - Matchers de DOM de Testing Library (toHaveAttribute, toHaveFocus,
 *   toBeInTheDocument…).
 * - Almacenamiento en memoria para pruebas jsdom: se instala con
 *   `Object.defineProperty` SIN leer `window.localStorage` antes. Leer
 *   la propiedad dispara el getter experimental de Node 26
 *   (`ExperimentalWarning: localStorage is not available…`); definirla
 *   directamente la sombrea y elimina la advertencia. Solo afecta a la
 *   ejecución de pruebas; producción usa el localStorage real del
 *   navegador.
 * - En entorno Node puro (tests `*.test.ts`) no hay `window` ni
 *   `document`: el setup no los toca.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

const store = new Map<string, string>();

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      get length() {
        return store.size;
      },
    },
  });

  // jsdom no implementa la reproducción de media: sin estos mocks,
  // el hook useAudioPlayer (y la página que lo usa) emiten
  // «Not implemented: HTMLMediaElement.prototype.play/pause» en cada
  // render y unmount. Los tests del hook los reemplazan por caso.
  HTMLMediaElement.prototype.play = () => Promise.resolve();
  HTMLMediaElement.prototype.pause = () => {};

  // jsdom tampoco implementa el contexto 2D: sin este stub, cualquier
  // render del Deck (p. ej. la página completa) imprime
  // «Not implemented: HTMLCanvasElement.prototype.getContext». El stub
  // es un contexto no-op; los tests del Deck lo reemplazan por caso.
  const noop = () => {};
  const gradient = { addColorStop: noop };
  const canvasCtx2d = {
    setTransform: noop,
    clearRect: noop,
    save: noop,
    restore: noop,
    beginPath: noop,
    arc: noop,
    stroke: noop,
    fill: noop,
    moveTo: noop,
    lineTo: noop,
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    lineWidth: 1,
    lineCap: 'round',
    globalAlpha: 1,
    strokeStyle: '',
    fillStyle: '',
  };
  HTMLCanvasElement.prototype.getContext = ((kind: string) =>
    kind === '2d' ? canvasCtx2d : null) as typeof HTMLCanvasElement.prototype.getContext;
}

// Aislamiento entre pruebas: sin DOM residual (cleanup de Testing
// Library, necesario sin `globals: true`), sin almacenamiento ni clases
// de tema en el body (ThemeToggle añade `day`), para que cada caso
// parta del estado inicial.
afterEach(() => {
  cleanup();
  store.clear();
  if (typeof document !== 'undefined') {
    document.body.classList.remove('day');
  }
});
