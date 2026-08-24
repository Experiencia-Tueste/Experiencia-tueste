import { describe, expect, it } from 'vitest';
import { loadAdminAuthConfig, parseAllowedEmails } from '../admin-config';

/**
 * Pruebas de la configuración server-only del panel: parsing de la
 * allowlist CSV, estado de Google y fallo cerrado. Sin credenciales
 * reales ni red.
 */

describe('admin-config · ADMIN_ALLOWED_EMAILS', () => {
  it('normaliza mayúsculas y espacios', () => {
    expect(parseAllowedEmails('  Admin@Tueste.Co , otro@tueste.co ')).toEqual([
      'admin@tueste.co',
      'otro@tueste.co',
    ]);
  });

  it('elimina duplicados', () => {
    expect(parseAllowedEmails('a@tueste.co,A@TUESTE.CO,a@tueste.co')).toEqual(['a@tueste.co']);
  });

  it('una lista vacía no autoriza a nadie', () => {
    expect(parseAllowedEmails(undefined)).toEqual([]);
    expect(parseAllowedEmails('')).toEqual([]);
    expect(parseAllowedEmails('   , ,  ')).toEqual([]);
  });

  it('un correo inválido produce un error claro', () => {
    expect(() => parseAllowedEmails('no-es-correo')).toThrow(/ADMIN_ALLOWED_EMAILS/);
  });
});

describe('admin-config · configuración de Google', () => {
  it('ambas variables ausentes → Google no configurado', () => {
    const config = loadAdminAuthConfig({});
    expect(config.googleConfigured).toBe(false);
    expect(config.allowedEmails).toEqual([]);
  });

  it('solo una variable → error claro de configuración parcial', () => {
    expect(() => loadAdminAuthConfig({ AUTH_GOOGLE_ID: 'id' })).toThrow(
      /Configuración incompleta de Google/,
    );
    expect(() => loadAdminAuthConfig({ AUTH_GOOGLE_SECRET: 'secret' })).toThrow(
      /Configuración incompleta de Google/,
    );
  });

  it('ambas presentes → Google configurado', () => {
    const config = loadAdminAuthConfig({
      AUTH_GOOGLE_ID: 'id',
      AUTH_GOOGLE_SECRET: 'secret',
      AUTH_SECRET: 'secret-sesion',
      ADMIN_ALLOWED_EMAILS: 'admin@tueste.co',
    });
    expect(config.googleConfigured).toBe(true);
    expect(config.googleClientId).toBe('id');
    expect(config.allowedEmails).toEqual(['admin@tueste.co']);
  });

  it('Google configurado sin AUTH_SECRET → error claro (fallo cerrado)', () => {
    expect(() =>
      loadAdminAuthConfig({ AUTH_GOOGLE_ID: 'id', AUTH_GOOGLE_SECRET: 'secret' }),
    ).toThrow(/AUTH_SECRET/);
  });
});
