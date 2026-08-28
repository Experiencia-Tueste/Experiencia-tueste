import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadPublicConfig } from '../env-public';
import { loadAdminStorageConfig, loadShopifyStoreUrl, loadSiteUrl } from '../env-server';

/**
 * Pruebas del contrato de configuración. Nunca dependen del entorno
 * real de la máquina: el entorno se inyecta explícitamente.
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

describe('loadAdminStorageConfig (Storage privado del panel)', () => {
  it('devuelve null si Storage no está configurado', () => {
    expect(loadAdminStorageConfig({})).toBeNull();
    expect(
      loadAdminStorageConfig({
        SUPABASE_STORAGE_URL: '',
        SUPABASE_STORAGE_ADMIN_KEY: '',
        SUPABASE_STORAGE_BUCKET: '',
      }),
    ).toBeNull();
  });

  it('exige configuración completa si se activa Storage', () => {
    expect(() =>
      loadAdminStorageConfig({ SUPABASE_STORAGE_URL: 'https://demo.supabase.co' }),
    ).toThrow(/Storage/);
  });

  it('devuelve la configuración privada completa', () => {
    expect(
      loadAdminStorageConfig({
        SUPABASE_STORAGE_URL: 'https://demo.supabase.co',
        SUPABASE_STORAGE_ADMIN_KEY: 'storage-admin-demo',
        SUPABASE_STORAGE_BUCKET: 'tueste-admin-assets',
      }),
    ).toEqual({
      supabaseUrl: 'https://demo.supabase.co',
      adminKey: 'storage-admin-demo',
      bucket: 'tueste-admin-assets',
    });
  });
});

describe('lectura literal para el bundle cliente', () => {
  it('supabasePublicEnv devuelve las públicas con acceso literal a process.env', () => {
    const src = readFileSync(resolve(__dirname, '../env-public.ts'), 'utf-8');
    // El acceso literal permite a Next reemplazar los valores en el
    // bundle cliente (la inyección no depende de `env` dinámico).
    expect(src).toContain('process.env.NEXT_PUBLIC_SUPABASE_URL');
    expect(src).toContain('process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
  });
});

describe('aislamiento server-only / público', () => {
  const serverSrc = readFileSync(resolve(__dirname, '../env-server.ts'), 'utf-8');
  const publicSrc = readFileSync(resolve(__dirname, '../env-public.ts'), 'utf-8');

  /** Código sin comentarios: los checks no chocan con el JSDoc. */
  const strip = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  it('env-server está protegido con import server-only', () => {
    expect(strip(serverSrc)).toContain("import 'server-only';");
  });

  it('env-public no importa server-only y solo declara NEXT_PUBLIC_*', () => {
    expect(strip(publicSrc)).not.toContain('server-only');
    expect(publicSrc).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(publicSrc).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    // No debe leer variables de servidor.
    expect(strip(publicSrc)).not.toContain('SITE_URL');
    expect(strip(publicSrc)).not.toContain('SHOPIFY_STORE_URL');
  });

  it('env-server no lee NEXT_PUBLIC_*', () => {
    expect(serverSrc).not.toContain('NEXT_PUBLIC_');
  });
});
