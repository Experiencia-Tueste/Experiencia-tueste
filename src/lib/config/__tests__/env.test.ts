import { describe, expect, it } from 'vitest';
import { loadPublicConfig } from '../env';

/**
 * Pruebas del contrato de configuración pública. Nunca dependen del
 * entorno real de la máquina: el entorno se inyecta explícitamente.
 */
describe('config env (contrato público)', () => {
  it('devuelve null si ambas variables están ausentes (modo demo)', () => {
    expect(loadPublicConfig({})).toBeNull();
    expect(loadPublicConfig({ NEXT_PUBLIC_SUPABASE_URL: undefined })).toBeNull();
  });

  it('devuelve null si ambas variables están vacías (modo demo)', () => {
    expect(
      loadPublicConfig({ NEXT_PUBLIC_SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_ANON_KEY: '' }),
    ).toBeNull();
    expect(
      loadPublicConfig({ NEXT_PUBLIC_SUPABASE_URL: '   ', NEXT_PUBLIC_SUPABASE_ANON_KEY: '  ' }),
    ).toBeNull();
  });

  it('devuelve las credenciales con configuración completa y válida', () => {
    const config = loadPublicConfig({
      NEXT_PUBLIC_SUPABASE_URL: 'https://demo.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-demo',
    });

    expect(config).toEqual({
      supabaseUrl: 'https://demo.supabase.co',
      supabaseAnonKey: 'anon-key-demo',
    });
  });

  it('falla con error claro si falta la clave anónima', () => {
    expect(() =>
      loadPublicConfig({ NEXT_PUBLIC_SUPABASE_URL: 'https://demo.supabase.co' }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it('falla con error claro si falta la URL', () => {
    expect(() => loadPublicConfig({ NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-demo' })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it('falla con error claro si la URL no es válida', () => {
    expect(() =>
      loadPublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'no-es-una-url',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-demo',
      }),
    ).toThrow(/URL válida/);
  });
});
