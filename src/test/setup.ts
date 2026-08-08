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
