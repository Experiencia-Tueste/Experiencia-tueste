import { describe, expect, it } from 'vitest';
import { ALL_CAPABILITIES, hasCapability, ROLE_CAPABILITIES } from '../permissions';

/**
 * Pruebas de roles y capacidades puras del panel. Sin React ni red.
 */

describe('admin · permisos por rol', () => {
  it('owner tiene todas las capacidades', () => {
    for (const capability of ALL_CAPABILITIES) {
      expect(hasCapability('owner', capability), capability).toBe(true);
    }
  });

  it('admin opera módulos pero no gestiona usuarios', () => {
    expect(hasCapability('admin', 'content.publish')).toBe(true);
    expect(hasCapability('admin', 'events.manage')).toBe(true);
    expect(hasCapability('admin', 'audit.read')).toBe(true);
    expect(hasCapability('admin', 'users.manage')).toBe(false);
  });

  it('editor lee y edita contenido pero no publica', () => {
    expect(hasCapability('editor', 'content.read')).toBe(true);
    expect(hasCapability('editor', 'content.edit')).toBe(true);
    expect(hasCapability('editor', 'content.publish')).toBe(false);
  });

  it('operador gestiona CRM, eventos y Tree, pero no publica contenido', () => {
    expect(hasCapability('operador', 'crm.manage')).toBe(true);
    expect(hasCapability('operador', 'events.manage')).toBe(true);
    expect(hasCapability('operador', 'tree.update')).toBe(true);
    expect(hasCapability('operador', 'content.publish')).toBe(false);
    expect(hasCapability('operador', 'users.manage')).toBe(false);
  });

  it('moderador solo modera comunidad', () => {
    expect(hasCapability('moderador', 'community.moderate')).toBe(true);
    expect(hasCapability('moderador', 'crm.manage')).toBe(false);
    expect(hasCapability('moderador', 'content.edit')).toBe(false);
    expect(hasCapability('moderador', 'users.manage')).toBe(false);
  });

  it('lector únicamente lecturas', () => {
    expect(hasCapability('lector', 'admin.access')).toBe(true);
    expect(hasCapability('lector', 'content.read')).toBe(true);
    expect(hasCapability('lector', 'crm.read')).toBe(true);
    expect(hasCapability('lector', 'content.edit')).toBe(false);
    expect(hasCapability('lector', 'crm.manage')).toBe(false);
    expect(hasCapability('lector', 'events.manage')).toBe(false);
  });

  it('el mapa cubre todos los roles sin capacidades fuera del catálogo', () => {
    for (const capabilities of Object.values(ROLE_CAPABILITIES)) {
      for (const capability of capabilities) {
        expect(ALL_CAPABILITIES).toContain(capability);
      }
    }
  });
});
