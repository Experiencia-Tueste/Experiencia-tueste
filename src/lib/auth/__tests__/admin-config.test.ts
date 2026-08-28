import { describe, expect, it } from 'vitest';
import { loadAdminAuthConfig } from '../admin-config';

/**
 * Pruebas de la configuración server-only del panel: parsing de la
 * allowlist CSV, estado de Google y fallo cerrado. Sin credenciales
 * reales ni red.
 */

describe('admin-config · configuración de Google', () => {
  it('ambas variables ausentes → Google no configurado', () => {
    const config = loadAdminAuthConfig({});
    expect(config.googleConfigured).toBe(false);
    expect(config.authSecret).toBe('');
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
    });
    expect(config.googleConfigured).toBe(true);
    expect(config.googleClientId).toBe('id');
    expect(config.authSecret).toBe('secret-sesion');
  });

  it('Google configurado sin AUTH_SECRET → error claro (fallo cerrado)', () => {
    expect(() =>
      loadAdminAuthConfig({ AUTH_GOOGLE_ID: 'id', AUTH_GOOGLE_SECRET: 'secret' }),
    ).toThrow(/AUTH_SECRET/);
  });
});
