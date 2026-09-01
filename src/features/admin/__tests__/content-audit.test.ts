import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildAuditEntry } from '../content-audit';
import { validateAuditMetadata } from '../audit';
import type { CurrentAdmin } from '../authorization-core';

/**
 * Pruebas de la corrección de auditoría de contenido: el actor de cada
 * entrada es el UUID persistido del admin (nunca el email), la entrada
 * completa es válida y las operaciones registran updatedAt en una
 * transacción atómica con razón explícita.
 */

const ADMIN: CurrentAdmin = {
  id: 'a3f8b6c2-9d4e-4f1a-8b7c-2d5e6f7a8b9c',
  email: 'admin@tueste.co',
  name: 'Santiago',
  role: 'owner',
  capabilities: ['content.read', 'content.edit', 'content.publish'],
};

describe('contenido · auditoría (actor UUID correcto)', () => {
  it('conserva actorUserId (UUID) y actorEmail (snapshot)', () => {
    const entry = buildAuditEntry(ADMIN, {
      action: 'content.created',
      targetType: 'content',
      targetId: 'c5d0e8f4-1b6a-4c3d-9e0f-4a7b8c9d0e1f',
      reason: 'Creación de borrador',
    });
    expect(entry.actorUserId).toBe(ADMIN.id);
    expect(entry.actorEmail).toBe(ADMIN.email);
    expect(entry.actorEmail).toMatch(/^[^@]+@[^@]+$/);
  });

  it('usa el UUID persistido del admin como actorUserId (nunca el email)', () => {
    const entry = buildAuditEntry(ADMIN, {
      action: 'content.published',
      targetType: 'content',
      targetId: 'b4c9d7e3-0a5f-4b2c-9d8e-3f6a7b8c9d0e',
      reason: 'Publicación aprobada por el owner',
      from: 'review',
      to: 'published',
    });

    expect(entry.actorUserId).toBe(ADMIN.id);
    expect(entry.actorUserId).not.toBe(ADMIN.email);
    // El UUID es válido (la validación del contrato lo garantiza).
    expect(entry.actorUserId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('produce una entrada de auditoría completa y JSON-segura', () => {
    const entry = buildAuditEntry(ADMIN, {
      action: 'content.reviewed',
      targetType: 'content',
      targetId: 'c5d0e8f4-1b6a-4c3d-9e0f-4a7b8c9d0e1f',
      reason: 'Envío a revisión editorial',
      from: 'draft',
      to: 'review',
      metadata: { slug: 'el-origen' },
    });

    expect(entry.reason.length).toBeGreaterThanOrEqual(3);
    expect(validateAuditMetadata(entry.metadata)).toBe(true);
    expect(() => JSON.stringify(entry)).not.toThrow();
  });

  it('rechaza razones vacías o con secretos', () => {
    expect(() =>
      buildAuditEntry(ADMIN, {
        action: 'content.created',
        targetType: 'content',
        targetId: 'c5d0e8f4-1b6a-4c3d-9e0f-4a7b8c9d0e1f',
        reason: '  ',
      }),
    ).toThrow();
    expect(() =>
      buildAuditEntry(ADMIN, {
        action: 'content.created',
        targetType: 'content',
        targetId: 'c5d0e8f4-1b6a-4c3d-9e0f-4a7b8c9d0e1f',
        reason: 'access_token=xyz',
      }),
    ).toThrow();
  });
});

describe('contenido · atomicidad, updatedAt y razones explícitas', () => {
  const SERVICE = readFileSync(
    resolve(process.cwd(), 'src/features/admin/content-service.ts'),
    'utf-8',
  );
  const REPO = readFileSync(resolve(process.cwd(), 'src/db/admin-content-repository.ts'), 'utf-8');

  it('las mutaciones de contenido y su auditoría son atómicas (transacción)', () => {
    expect(SERVICE).toContain('getDb().transaction(async (tx) => {');
    expect(SERVICE).toMatch(/appendAudit\([^)]*,\s*tx\)/);
  });

  it('actualiza updatedAt al editar y al cambiar de estado', () => {
    const updateBlock = REPO.slice(REPO.indexOf('async updateContent'));
    const statusBlock = REPO.slice(REPO.indexOf('async setContentStatus'));
    expect(updateBlock).toContain('updatedAt: new Date()');
    expect(statusBlock).toContain('updatedAt: now');
  });

  it('usa admin.id como actor en todas las operaciones (nunca el email)', () => {
    const codigo = SERVICE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(codigo).not.toContain('actorId: admin.email');
    expect(codigo).toContain('actorId: admin.id');

    // La entrada de auditoría se construye con el UUID del admin.
    const audit = readFileSync(
      resolve(process.cwd(), 'src/features/admin/content-audit.ts'),
      'utf-8',
    );
    expect(audit).toContain('actorUserId: admin.id');
  });

  it('la transición verifica el estado esperado en la persistencia e incrementa version', () => {
    const repo = readFileSync(
      resolve(process.cwd(), 'src/db/admin-content-repository.ts'),
      'utf-8',
    );
    // El UPDATE exige el estado actual en el WHERE (sin condiciones de carrera).
    expect(repo).toMatch(/eq\(contentEntries\.status, from\)/);
    // El cambio de estado incrementa version.
    const statusBlock = repo.slice(repo.indexOf('async setContentStatus'));
    expect(statusBlock).toContain('version: sql`${contentEntries.version} + 1`');
    expect(statusBlock).toContain('updatedAt: now');
  });

  it('no deja razones ocultas por defecto en la UI de transiciones', () => {
    const forms = readFileSync(
      resolve(process.cwd(), 'src/app/admin/contenido/ContenidoForms.tsx'),
      'utf-8',
    );
    expect(forms).not.toContain('type="hidden" name="reason"');
    expect(forms).toContain('name="reason"');
    expect(forms).toContain('required');
  });
});
