import { describe, expect, it } from 'vitest';
import { resolvePersistedAdmin } from '@/features/admin/authorization-core';
import type { AdminUser, AdminRole } from '@/features/admin/identity';

/**
 * Pruebas de la autorización PURA del RBAC persistente (sin Auth.js,
 * sin red ni base de datos): la lógica que decide el acceso a partir
 * del usuario persistente y sus roles.
 */

const USUARIO_ACTIVO: AdminUser = {
  id: 'usr_1',
  email: 'admin@tueste.co',
  displayName: 'Santiago',
  status: 'active',
  createdAt: '2026-08-24T12:00:00.000Z',
  updatedAt: '2026-08-24T12:00:00.000Z',
  roleIds: ['role_admin'],
};

const ROL_ADMIN: AdminRole = {
  id: 'role_admin',
  key: 'admin',
  name: 'Administrador',
  description: 'Operación completa de módulos autorizados.',
  capabilities: ['content.publish', 'events.manage'],
};

describe('admin · autorización pura (RBAC persistente)', () => {
  it('usuario inexistente => acceso denegado', () => {
    expect(resolvePersistedAdmin(null, [])).toBeNull();
    expect(resolvePersistedAdmin(null, [ROL_ADMIN])).toBeNull();
  });

  it('usuario suspendido o invitado => acceso denegado', () => {
    expect(
      resolvePersistedAdmin({ ...USUARIO_ACTIVO, status: 'suspended' }, [ROL_ADMIN]),
    ).toBeNull();
    expect(resolvePersistedAdmin({ ...USUARIO_ACTIVO, status: 'invited' }, [ROL_ADMIN])).toBeNull();
  });

  it('usuario activo sin rol => acceso denegado', () => {
    expect(resolvePersistedAdmin(USUARIO_ACTIVO, [])).toBeNull();
  });

  it('usuario activo con rol => CurrentAdmin con capacidades correctas', () => {
    const admin = resolvePersistedAdmin(USUARIO_ACTIVO, [ROL_ADMIN]);
    expect(admin).toEqual({
      id: 'usr_1',
      email: 'admin@tueste.co',
      name: 'Santiago',
      role: 'admin',
      capabilities: expect.arrayContaining(['content.publish', 'events.manage']),
    });
  });

  it('combina las capacidades de varios roles (no descarta roles secundarios)', () => {
    const rolModerador: AdminRole = {
      id: 'role_mod',
      key: 'moderador',
      name: 'Moderador',
      description: 'Modera comunidad.',
      capabilities: ['community.moderate'],
    };
    const admin = resolvePersistedAdmin(USUARIO_ACTIVO, [ROL_ADMIN, rolModerador]);
    expect(admin?.role).toBe('admin'); // jerarquía
    expect(admin?.capabilities).toContain('content.publish');
    expect(admin?.capabilities).toContain('community.moderate'); // rol secundario
    expect(admin?.capabilities).toContain('crm.read'); // del rol admin
  });

  it('elige el rol de mayor jerarquía cuando hay varios', () => {
    const rolEditor: AdminRole = {
      ...ROL_ADMIN,
      id: 'role_editor',
      key: 'editor',
      name: 'Editor',
      description: 'Editor',
    };
    const admin = resolvePersistedAdmin(USUARIO_ACTIVO, [rolEditor, ROL_ADMIN]);
    expect(admin?.role).toBe('admin');
  });
});
