import { describe, expect, it } from 'vitest';
import { ADMIN_ROLE_SCHEMA, ADMIN_USER_SCHEMA } from '../identity';
import { ALL_CAPABILITIES } from '../permissions';

/**
 * Pruebas del modelo de identidad persistente (solo tipos y Zod, sin DB).
 */

const VALID_USER = {
  id: 'usr_1',
  email: 'admin@tueste.co',
  displayName: 'Santiago',
  status: 'active' as const,
  createdAt: '2026-08-24T12:00:00.000Z',
  updatedAt: '2026-08-24T12:00:00.000Z',
  roleIds: ['role_admin'],
};

describe('admin · identidad persistente', () => {
  it('acepta un usuario persistente válido y normaliza el correo', () => {
    const user = ADMIN_USER_SCHEMA.parse({ ...VALID_USER, email: '  Admin@Tueste.Co ' });
    expect(user.email).toBe('admin@tueste.co');
    expect(user.status).toBe('active');
  });

  it('rechaza correos inválidos', () => {
    expect(() => ADMIN_USER_SCHEMA.parse({ ...VALID_USER, email: 'no-es-correo' })).toThrow();
  });

  it('rechaza estados desconocidos', () => {
    expect(() => ADMIN_USER_SCHEMA.parse({ ...VALID_USER, status: 'banneado' })).toThrow();
  });

  it('rechaza fechas que no son ISO válidas', () => {
    expect(() => ADMIN_USER_SCHEMA.parse({ ...VALID_USER, createdAt: 'ayer' })).toThrow();
  });

  it('un rol con capacidades válidas pasa la validación', () => {
    const rol = ADMIN_ROLE_SCHEMA.parse({
      id: 'role_admin',
      key: 'admin',
      name: 'Administrador',
      description: 'Operación completa de módulos autorizados.',
      capabilities: ['content.publish', 'events.manage'],
    });
    expect(rol.capabilities.length).toBe(2);
    for (const capability of rol.capabilities) {
      expect(ALL_CAPABILITIES).toContain(capability);
    }
  });

  it('rechaza roles con claves o capacidades desconocidas', () => {
    expect(() =>
      ADMIN_ROLE_SCHEMA.parse({
        id: 'role_x',
        key: 'superadmin',
        name: 'X',
        description: 'X',
        capabilities: ['content.publish'],
      }),
    ).toThrow();
    expect(() =>
      ADMIN_ROLE_SCHEMA.parse({
        id: 'role_x',
        key: 'admin',
        name: 'X',
        description: 'X',
        capabilities: ['pagar.todo'],
      }),
    ).toThrow();
  });
});
