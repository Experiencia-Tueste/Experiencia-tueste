import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Pruebas de la implementación server-only del repositorio de identidad:
 * el módulo no filtra secretos, no expone conexiones y las consultas
 * solo viven dentro de sus métodos (nunca en top-level).
 */

const SOURCE = readFileSync(resolve(__dirname, '../admin-identity-repository.ts'), 'utf-8');

describe('db · repositorio de identidad (server-only)', () => {
  it('declara import "server-only" como primera instrucción', () => {
    expect(SOURCE.startsWith("import 'server-only';")).toBe(true);
  });

  it('no expone secretos ni DATABASE_URL al cliente', () => {
    const codigo = SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    for (const patron of [
      'process.env',
      'DATABASE_URL',
      'NEXT_PUBLIC',
      'service_role',
      'service-role',
      'supabase',
    ]) {
      expect(codigo.toLowerCase(), `no debe contener ${patron}`).not.toContain(
        patron.toLowerCase(),
      );
    }
  });

  it('implementa identidad, capacidades, vendedores y auditoría', () => {
    for (const metodo of [
      'findUserByEmail',
      'findUserById',
      'findRolesByUserId',
      'listRoles',
      'listVendors',
      'findVendorByUserId',
      'listAudit',
      'appendAudit',
    ]) {
      expect(SOURCE).toContain(`async ${metodo}(`);
    }
    expect(SOURCE).toContain('implements AdminIdentityRepository');
    expect(SOURCE).toContain('adminRoleCapabilities');
  });

  it('no ejecuta consultas al importar el módulo (todo vive en métodos)', () => {
    // El top-level del módulo solo declara la clase; ninguna consulta
    // aparece fuera de los métodos.
    const topLevel = SOURCE.split('export class')[0];
    expect(topLevel).not.toContain('.select()');
    expect(topLevel).not.toContain('.insert(');
    expect(topLevel).not.toContain('getDb()');
  });

  it('appendAudit valida con el contrato antes de persistir', () => {
    const codigo = SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(codigo).toContain('parseAuditEntry');
  });

  it('createOrGetVendorMembership nunca resuelve identidad de vendedor por nombre de marca', () => {
    // Regresión: un texto libre y público (el nombre de marca del
    // solicitante) NO puede usarse para emparejar con un vendedor
    // existente — eso permitiría secuestrar la cuenta de otro vendedor
    // solo repitiendo su nombre en una solicitud nueva.
    const method = SOURCE.slice(
      SOURCE.indexOf('async createOrGetVendorMembership'),
      SOURCE.indexOf('async appendAudit'),
    );
    expect(method).not.toContain('lower(${vendors.name})');
    expect(method).not.toContain('normalizedName');
    // Cada aprobación sin membresía ya verificada por email inserta un
    // vendedor nuevo incondicionalmente.
    expect(method).toContain('.insert(vendors)');
    expect(method).toContain('createdVendor: true');
  });
});
