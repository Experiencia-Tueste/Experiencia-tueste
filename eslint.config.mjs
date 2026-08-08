import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

/**
 * Configuración flat de ESLint (Next.js 16).
 * Reglas recomendadas de Next.js + TypeScript + Core Web Vitals, con la
 * integración de Prettier al final para desactivar reglas de estilo que
 * ya gestiona el formateador.
 */
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores([
    'node_modules/**',
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'next-env.d.ts',
    '*.config.{js,mjs,ts}',
  ]),
]);
