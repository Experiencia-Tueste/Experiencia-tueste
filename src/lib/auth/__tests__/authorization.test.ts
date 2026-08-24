import { describe, expect, it } from 'vitest';
import { resolveAdminRole } from '@/features/admin/authorization-core';

/**
 * Pruebas de la autorización PURA del panel (sin Auth.js, sin red ni
 * sesiones reales): la lógica que decide el rol de un correo contra la
 * allowlist.
 */

const ALLOWED = ['admin@tueste.co', 'editor@tueste.co'];

describe('admin · autorización pura (resolveAdminRole)', () => {
  it('un correo permitido obtiene el rol temporal admin', () => {
    expect(resolveAdminRole('Admin@Tueste.Co', ALLOWED)).toBe('admin');
    expect(resolveAdminRole('editor@tueste.co', ALLOWED)).toBe('admin');
  });

  it('un correo no permitido se rechaza', () => {
    expect(resolveAdminRole('otro@externo.com', ALLOWED)).toBeNull();
    expect(resolveAdminRole('admin@tueste.co', [])).toBeNull();
  });

  it('la ausencia de correo se rechaza', () => {
    expect(resolveAdminRole(null, ALLOWED)).toBeNull();
    expect(resolveAdminRole(undefined, ALLOWED)).toBeNull();
    expect(resolveAdminRole('', ALLOWED)).toBeNull();
    expect(resolveAdminRole('   ', ALLOWED)).toBeNull();
  });
});
