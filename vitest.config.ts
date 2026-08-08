import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

/**
 * Vite + Vitest, TypeScript, sin UI frameworks.
 *
 * - Tests puros (`*.test.ts`): entorno node (por defecto).
 * - Tests de componentes (`*.test.tsx`): entorno jsdom (DOM + Testing
 *   Library), mediante environmentMatchGlobs.
 * - Alias `@/` → `src/` (mismo paths que tsconfig) para que los
 *   componentes importen igual que en la app.
 * - jsdom con URL de origen; el almacenamiento de prueba (localStorage
 *   en memoria) se instala en `src/test/setup.ts`.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environmentMatchGlobs: [['src/**/*.test.tsx', 'jsdom']],
    environmentOptions: {
      jsdom: { url: 'http://localhost:3000' },
    },
    setupFiles: ['src/test/setup.ts'],
  },
});
