import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Frontera de Supabase y contrato del contenedor de producción:
 * - `supabase/server.ts` está protegido con `server-only`.
 * - El Dockerfile es multi-stage, corre como no-root y sirve standalone.
 * - `.dockerignore` excluye secretos y artefactos locales.
 */

const SUPABASE_SERVER = readFileSync(resolve(__dirname, '../server.ts'), 'utf-8');
const SUPABASE_CLIENT = readFileSync(resolve(__dirname, '../client.ts'), 'utf-8');
const DOCKERFILE = readFileSync(resolve(__dirname, '../../../../Dockerfile'), 'utf-8');
const DOCKERIGNORE = readFileSync(resolve(__dirname, '../../../../.dockerignore'), 'utf-8');
const NODE_VERSION = readFileSync(resolve(__dirname, '../../../../.nvmrc'), 'utf-8').trim();

describe('frontera Supabase (server-only)', () => {
  it('supabase/server.ts está protegido con import server-only', () => {
    expect(SUPABASE_SERVER).toContain("import 'server-only';");
  });

  it('supabase/client.ts no importa server-only', () => {
    expect(SUPABASE_CLIENT).not.toContain('server-only');
  });

  it('modo demo: sin variables Supabase, createServerSupabase devuelve null', async () => {
    // El contrato loadPublicConfig({}) → null está cubierto en
    // env.test.ts; aquí se garantiza que el cliente de servidor no
    // depende de valores reales para construirse en demo.
    expect(SUPABASE_SERVER).toContain('if (!config)');
    expect(SUPABASE_SERVER).toContain('return null');
  });
});

describe('contrato del contenedor de producción', () => {
  it('el Dockerfile es multi-stage (builder → runner) sin etapa deps muerta', () => {
    expect(DOCKERFILE).toContain('FROM node:${NODE_VERSION}-bookworm-slim AS builder');
    expect(DOCKERFILE).toContain('FROM node:${NODE_VERSION}-bookworm-slim AS runner');
    expect(DOCKERFILE).not.toContain('AS deps');
  });

  it('fija la versión de Node desde .nvmrc vía ARG NODE_VERSION', () => {
    expect(DOCKERFILE).toContain(`ARG NODE_VERSION=${NODE_VERSION}`);
  });

  it('SITE_URL es un build arg público con fallback demo (no secreto)', () => {
    expect(DOCKERFILE).toContain('ARG SITE_URL=http://localhost:3000');
    expect(DOCKERFILE).toContain('ENV SITE_URL=${SITE_URL}');
    expect(DOCKERFILE).not.toMatch(/ARG .*SECRET|ARG .*TOKEN|ARG .*PASSWORD/);
  });

  it('instala con npm ci y copia solo standalone, public y .next/static', () => {
    expect(DOCKERFILE).toMatch(/npm ci/);
    expect(DOCKERFILE).toContain('.next/standalone');
    expect(DOCKERFILE).toContain('COPY --from=builder --chown=nextjs:nodejs /app/public ./public');
    expect(DOCKERFILE).toContain(
      'COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static',
    );
  });

  it('corre como usuario no-root, expone 3000 y usa node server.js', () => {
    expect(DOCKERFILE).toContain('useradd --system --uid 1001 --gid nodejs nextjs');
    expect(DOCKERFILE).toContain('USER nextjs');
    expect(DOCKERFILE).toContain('EXPOSE 3000');
    expect(DOCKERFILE).toContain('CMD ["node", "server.js"]');
  });

  it('el Dockerfile no copia .env* ni secretos', () => {
    expect(DOCKERFILE).not.toMatch(/COPY .*\.env/);
    expect(DOCKERFILE).not.toMatch(/SECRET|TOKEN|PASSWORD|API_KEY/);
  });

  it('.dockerignore excluye .env*, infra, node_modules, .next y cobertura', () => {
    for (const entry of ['.env*', 'infra', 'node_modules', '.next', 'coverage', '*.log']) {
      expect(DOCKERIGNORE).toContain(entry);
    }
  });

  it('el .dockerignore no excluye archivos necesarios para el build', () => {
    for (const entry of ['package.json', 'package-lock.json', 'src', 'public']) {
      expect(DOCKERIGNORE).not.toMatch(new RegExp(`^${entry}$`, 'm'));
    }
  });

  it('el contenedor no copia las referencias externas del proyecto', () => {
    for (const entry of ['plan master', 'Master Debugg', 'iconos', 'PLAN-ARQUITECTURA']) {
      expect(DOCKERIGNORE).toContain(entry);
    }
  });
});
