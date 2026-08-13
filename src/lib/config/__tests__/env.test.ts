import { describe, expect, it } from 'vitest';
import { loadPublicConfig, loadShopifyStoreUrl, loadSiteUrl } from '../env';

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

describe('loadSiteUrl (URL canónica del sitio)', () => {
  it('usa el fallback local de desarrollo/build si SITE_URL está ausente o vacía', () => {
    expect(loadSiteUrl({})).toBe('http://localhost:3000');
    expect(loadSiteUrl({ SITE_URL: '' })).toBe('http://localhost:3000');
    expect(loadSiteUrl({ SITE_URL: '   ' })).toBe('http://localhost:3000');
  });

  it('devuelve la URL absoluta válida configurada', () => {
    expect(loadSiteUrl({ SITE_URL: 'https://tueste.ejemplo.com' })).toBe(
      'https://tueste.ejemplo.com',
    );
  });

  it('falla con error claro si SITE_URL no es una URL absoluta válida', () => {
    expect(() => loadSiteUrl({ SITE_URL: 'no-es-una-url' })).toThrow(/SITE_URL/);
  });
});

describe('loadShopifyStoreUrl (URL pública de la tienda)', () => {
  it('devuelve null si SHOPIFY_STORE_URL está ausente o vacía', () => {
    expect(loadShopifyStoreUrl({})).toBeNull();
    expect(loadShopifyStoreUrl({ SHOPIFY_STORE_URL: '' })).toBeNull();
    expect(loadShopifyStoreUrl({ SHOPIFY_STORE_URL: '   ' })).toBeNull();
  });

  it('devuelve la URL https:// válida configurada', () => {
    expect(loadShopifyStoreUrl({ SHOPIFY_STORE_URL: 'https://tueste.myshopify.com' })).toBe(
      'https://tueste.myshopify.com',
    );
  });

  it('falla con error claro si la URL no es absoluta https://', () => {
    expect(() => loadShopifyStoreUrl({ SHOPIFY_STORE_URL: 'no-es-una-url' })).toThrow(
      /SHOPIFY_STORE_URL/,
    );
    expect(() => loadShopifyStoreUrl({ SHOPIFY_STORE_URL: 'http://tueste.com' })).toThrow(
      /SHOPIFY_STORE_URL/,
    );
  });
});
