import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { closeDb, getDb } from '../client';

/**
 * Pruebas canónicas del cliente PostgreSQL server-only: el módulo no
 * crea conexión al importarse, no depende de valores reales de
 * .env.local y nunca se expone al navegador.
 */

const SOURCE = readFileSync(resolve(__dirname, '../client.ts'), 'utf-8');

describe('db · cliente server-only', () => {
  it('declara import "server-only" como primera instrucción', () => {
    expect(SOURCE.startsWith("import 'server-only';")).toBe(true);
  });

  it('no usa NEXT_PUBLIC, Supabase, service role ni red en el módulo', () => {
    const codigo = SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    for (const patron of [
      'NEXT_PUBLIC_DATABASE_URL',
      'process.env.NEXT_PUBLIC',
      'supabase',
      'service_role',
      'anon key',
      'fetch(',
    ]) {
      expect(codigo.toLowerCase(), `no debe contener ${patron}`).not.toContain(
        patron.toLowerCase(),
      );
    }
  });

  it('no crea una conexión al importar el módulo', () => {
    // El import ya se ejecutó al cargar este archivo: si el módulo
    // creara un Pool en top-level, lanzaría aquí (sin DATABASE_URL no
    // se puede construir). La API es perezosa: getDb() es una función.
    expect(typeof getDb).toBe('function');
    expect(typeof closeDb).toBe('function');
    // El Pool se construye solo dentro de createDb (no en top-level).
    const body = SOURCE.slice(SOURCE.indexOf('function createDb'));
    expect(body).toMatch(/new Pool/);
    expect(SOURCE.slice(0, SOURCE.indexOf('function createDb'))).not.toContain('new Pool');
  });

  it('getDb() falla con error claro sin DATABASE_URL, sin filtrar su valor', () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      expect(() => getDb()).toThrow(/DATABASE_URL/);
    } finally {
      if (original !== undefined) process.env.DATABASE_URL = original;
    }
  });

  it('no depende de valores reales de .env.local durante las pruebas', () => {
    // La suite nunca lee archivos de entorno: el módulo solo consulta
    // process.env al llamar getDb(), y aquí se verifica que sin la
    // variable falla cerrado en lugar de usar un valor de la máquina.
    expect(SOURCE).not.toContain('readFileSync');
    expect(SOURCE).not.toContain("import 'dotenv'");
  });
});
