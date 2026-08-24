import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Pruebas del puerto de repositorio: SOLO interfaz y tipos. El fuente
 * no debe importar librerías de infraestructura ni acceder a
 * process.env.
 */

const SOURCE = readFileSync(resolve(__dirname, '../repository.ts'), 'utf-8');

describe('admin · puerto de repositorio (sin implementación)', () => {
  it('no importa librerías de infraestructura ni drivers', () => {
    for (const patron of [
      'from "pg"',
      "from 'pg'",
      '@prisma',
      'drizzle',
      '@supabase',
      'postgres',
      'fetch(',
    ]) {
      expect(SOURCE, `no debe contener ${patron}`).not.toContain(patron);
    }
  });

  it('no accede a process.env', () => {
    expect(SOURCE).not.toContain('process.env');
  });

  it('solo declara la interfaz del repositorio (sin implementación)', () => {
    const codigo = SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(codigo).toContain('interface AdminIdentityRepository');
    expect(codigo).toContain('findUserByEmail(email: string): Promise<AdminUser | null>');
    expect(codigo).toContain('findUserById(id: string): Promise<AdminUser | null>');
    expect(codigo).toContain('findRolesByUserId(userId: string): Promise<AdminRole[]>');
    expect(codigo).toContain('appendAudit(entry: AuditLogEntry): Promise<void>');
    // Sin implementación concreta: sin export de clase ni objeto repo.
    expect(codigo).not.toContain('class ');
    expect(codigo).not.toContain('new Map');
    expect(codigo).not.toContain('in-memory');
  });
});
