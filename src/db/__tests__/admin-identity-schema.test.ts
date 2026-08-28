import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  adminRoles,
  adminUserRoles,
  adminUsers,
  auditLogs,
  privateSchema,
} from '../schema/admin-identity';
import { ADMIN_ROLES_SEED } from '../admin-identity-seed';
import { ROLE_CAPABILITIES } from '@/features/admin/permissions';
import type { AdminRole } from '@/features/admin/permissions';

/**
 * Pruebas del esquema declarativo de identidad (Drizzle): tablas
 * declaradas, estados y roles alineados con los contratos, y ausencia
 * de red, Supabase, SQL, variables de entorno y valores dinámicos.
 */

const SCHEMA_SOURCE = readFileSync(resolve(__dirname, '../schema/admin-identity.ts'), 'utf-8');
const SEED_SOURCE = readFileSync(resolve(__dirname, '../admin-identity-seed.ts'), 'utf-8');

describe('db · esquema declarativo de identidad', () => {
  it('declara las cuatro tablas en el schema private', () => {
    // El nombre de tabla existe en runtime de Drizzle; el acceso se hace
    // con cast porque el tipo público no lo expone.
    const tableName = (table: unknown) =>
      (table as Record<symbol, unknown>)[Symbol.for('drizzle:Name')] as string;

    expect(privateSchema).toBeDefined();
    expect(tableName(adminUsers)).toBe('admin_users');
    expect(tableName(adminRoles)).toBe('admin_roles');
    expect(tableName(adminUserRoles)).toBe('admin_user_roles');
    expect(tableName(auditLogs)).toBe('audit_logs');
  });

  it('los tres estados de usuario son exactamente los actuales', () => {
    expect(SCHEMA_SOURCE).toContain("status: text('status').notNull()");
    expect(SCHEMA_SOURCE).toMatch(/invited \| active \| suspended/);
  });

  it('el seed contiene exactamente los seis roles actuales', () => {
    expect(ADMIN_ROLES_SEED.map((rol) => rol.key)).toEqual([
      'owner',
      'admin',
      'editor',
      'operador',
      'moderador',
      'lector',
    ]);
  });

  it('los roles y capacidades del seed están alineados con permissions.ts', () => {
    for (const rol of ADMIN_ROLES_SEED) {
      expect(rol.capabilities).toEqual([...ROLE_CAPABILITIES[rol.key as AdminRole]]);
    }
    // Sin capacidades duplicadas ni claves fuera del contrato.
    const claves = new Set(ADMIN_ROLES_SEED.map((rol) => rol.key));
    expect(claves.size).toBe(ADMIN_ROLES_SEED.length);
  });

  it('no hay red, Supabase, SQL ni variables de entorno', () => {
    for (const fuenteCruda of [SCHEMA_SOURCE, SEED_SOURCE]) {
      // Se evalúa el código sin comentarios: los JSDoc pueden nombrar la
      // prohibición sin usarla.
      const fuente = fuenteCruda.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      for (const patron of [
        'fetch(',
        'supabase',
        'DATABASE_URL',
        'process.env',
        'drizzle-orm/node-postgres',
        'drizzle-orm/postgres-js',
        'migrate(',
        'SELECT ',
      ]) {
        expect(fuente.toLowerCase(), `no debe contener ${patron}`).not.toContain(
          patron.toLowerCase(),
        );
      }
    }
  });

  it('no hay fechas dinámicas, Math.random, console.log, .only ni .skip', () => {
    for (const fuente of [SCHEMA_SOURCE, SEED_SOURCE]) {
      expect(fuente).not.toContain('Math.random');
      expect(fuente).not.toContain('Date.now');
      expect(fuente).not.toContain('console.log');
      expect(fuente).not.toContain('.only(');
      expect(fuente).not.toContain('.skip(');
    }
  });
});
