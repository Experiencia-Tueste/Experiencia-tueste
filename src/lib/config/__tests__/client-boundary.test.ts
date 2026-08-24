import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Frontera cliente/servidor del contrato de configuración:
 * - Ningún archivo `'use client'` importa `env-server` (que está
 *   protegido con `import 'server-only'`).
 * - `process.env` solo se lee dentro de los módulos de configuración
 *   permitidos (`env-public.ts`, `env-server.ts`).
 */

const SRC = resolve(__dirname, '../../..');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules' || entry.name === '.next') {
        continue;
      }
      out.push(...walk(full));
    } else if (/\.(ts|tsx|mjs|js)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe('frontera cliente/servidor (configuración)', () => {
  const files = walk(SRC);

  it('ningún componente cliente importa la configuración server-only', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const code = readFileSync(file, 'utf-8');
      if (!code.startsWith("'use client'") && !code.includes('"use client"')) continue;
      if (code.includes("from '@/lib/config/env-server'") || code.includes('env-server')) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('ningún componente cliente importa rutas de administración sensibles', () => {
    // Patrones de administración que jamás deben alcanzar un bundle
    // cliente, ni directa ni indirectamente (imports de módulos).
    const SENSITIVE_PATTERNS = [
      '@/lib/config/admin-auth-env',
      'lib/config/admin-auth-env',
      '@/lib/auth/',
      'lib/auth/',
      '@/auth',
      'next-auth',
    ];

    const offenders: string[] = [];
    for (const file of files) {
      const raw = readFileSync(file, 'utf-8');
      if (!raw.startsWith("'use client'") && !raw.includes('"use client"')) continue;
      // Se evalúa el código sin comentarios: los JSDoc pueden nombrar la
      // prohibición sin importarla.
      const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      for (const pattern of SENSITIVE_PATTERNS) {
        if (code.includes(pattern)) {
          offenders.push(`${file} -> ${pattern}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('process.env solo vive en los módulos de configuración', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const raw = readFileSync(file, 'utf-8');
      // Se evalúa el código sin comentarios (los JSDoc documentan la
      // prohibición de process.env, no la usan).
      const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      if (!code.includes('process.env')) continue;
      const rel = file.slice(SRC.length + 1);
      if (!rel.startsWith('lib/config/')) {
        offenders.push(rel);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('ningún secreto real aparece en el código rastreado', () => {
    for (const file of files) {
      const code = readFileSync(file, 'utf-8');
      // Patrones típicos de keys de AWS/Supabase service-role/tokens.
      expect(code).not.toMatch(/service_role/i);
      expect(code).not.toMatch(/AKIA[0-9A-Z]{16}/);
      expect(code).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/);
    }
  });
});
