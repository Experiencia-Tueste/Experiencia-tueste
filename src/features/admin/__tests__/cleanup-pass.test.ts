import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { assertRoleKey } from '@/db/admin-identity-seed';
import { mensajeSeguro } from '@/app/admin/contenido/error-messages';
import { CONTENT_DRAFT_SCHEMA } from '../content-schemas';

/**
 * Pruebas de la pasada final de limpieza: la documentación no debe
 * afirmar fuera de bloques HISTORIAL que falta PostgreSQL, migraciones
 * o persistencia; el log de autorización no debe filtrar secretos; las
 * fábricas de repositorio y las claves de rol se mantienen coherentes.
 */

/** Normaliza para comparar sin sensibilidad a mayúsculas ni tildes. */
function norm(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

describe('limpieza · documentación coherente', () => {
  const DOCS = ['docs/admin-panel.md', 'README.md'];

  /**
   * Afirmaciones que contradicen la arquitectura actual (RBAC
   * persistente en PostgreSQL con migraciones Drizzle). Solo pueden
   * aparecer dentro de bloques HISTORIAL.
   */
  const OBSOLETAS: RegExp[] = [
    /no hay base de datos|sin base de datos/,
    /sin conexion de base de datos|no existe conexion de base de datos/,
    /no hay migraciones|sin migraciones|no se han creado tablas|no existen tablas|no hay tablas/,
    /la siguiente fase configurara|siguiente fase \(1\.2\.2\): configurar/,
    /todavia no existe/,
    /postgresql sera necesario antes de activar/,
    /solo declarativo|unicamente declarativo|meramente declarativo|rol temporal/,
  ];

  it('las afirmaciones obsoletas solo aparecen dentro de bloques HISTORIAL', () => {
    for (const ruta of DOCS) {
      const lineas = readFileSync(resolve(process.cwd(), ruta), 'utf-8').split('\n');

      let enHistorial = false;
      for (const linea of lineas) {
        if (/^#{1,3}\s.*(HISTORIAL|Historial)/.test(linea)) {
          // Solo el ENCABEZADO de una sección marcada abre el bloque
          // (las notas interiores tipo «> **Historial:**» no).
          enHistorial = true;
        } else if (/^#{2,3}\s/.test(linea)) {
          // El bloque termina con el siguiente encabezado de sección.
          enHistorial = false;
        }
        if (!enHistorial) {
          const lineaNorm = norm(linea);
          for (const patron of OBSOLETAS) {
            expect(
              patron.test(lineaNorm),
              `${ruta}: afirmación obsoleta fuera de HISTORIAL en: «${linea.trim()}»`,
            ).toBe(false);
          }
        }
      }
    }
  });

  it('describe el estado actual como RBAC persistente y Fase 2 parcial', () => {
    for (const ruta of DOCS) {
      const doc = norm(readFileSync(resolve(process.cwd(), ruta), 'utf-8'));
      expect(doc).toContain('rbac persistente implementado');
      expect(doc).toContain('fase 2 parcialmente implementada');
    }
  });
});

describe('limpieza · autorización fail closed con log seguro', () => {
  it('el log del catch no filtra secretos ni valores de configuración', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/lib/auth/authorization.ts'), 'utf-8');
    const codigo = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    // El catch conserva fail closed y registra un marcador seguro.
    expect(codigo).toContain('console.error');
    expect(codigo).toContain('error instanceof Error');
    expect(codigo).toContain('error.name');
    expect(codigo).toContain('return null');
    // Nunca se registran detalles sensibles.
    expect(codigo).not.toContain('DATABASE_URL');
    expect(codigo).not.toContain('error.message');
    expect(codigo).not.toContain('process.env');
  });
});

describe('limpieza · Server Actions con traducción segura de errores', () => {
  it('conserva únicamente códigos de error controlados', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      for (const code of ['400', '401', '403', '404', '409']) {
        expect(mensajeSeguro(new Error(`${code}: mensaje funcional`))).toBe(
          `${code}: mensaje funcional`,
        );
      }
      expect(mensajeSeguro(new Error('418: detalle interno'))).toBe(
        'No se pudo completar la operación. Intenta nuevamente.',
      );
      expect(mensajeSeguro(new Error('999: DATABASE_URL=secreta'))).toBe(
        'No se pudo completar la operación. Intenta nuevamente.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('traduce Zod y slug duplicado sin filtrar detalles internos', () => {
    let zodError: unknown;
    try {
      CONTENT_DRAFT_SCHEMA.parse({ title: 'X', slug: 'slug_invalido' });
    } catch (error) {
      zodError = error;
    }
    expect(mensajeSeguro(zodError)).toContain('Slug inválido');
    expect(mensajeSeguro({ code: '23505', detail: 'SQL interno' })).toBe(
      'Ya existe un elemento con ese slug. Elige otro.',
    );
  });

  it('usa un mensaje genérico y registra únicamente el nombre del error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new Error('500: DATABASE_URL=secreta');

    expect(mensajeSeguro(error)).toBe('No se pudo completar la operación. Intenta nuevamente.');
    expect(errorSpy).toHaveBeenCalledWith(
      '[admin-contenido] error inesperado en Server Action.',
      'Error',
    );
    expect(errorSpy.mock.calls.flat().join(' ')).not.toContain('DATABASE_URL');
    errorSpy.mockRestore();
  });
});

describe('limpieza · fábricas de repositorio coherentes', () => {
  it('las fábricas crean instancias nuevas (comentario coherente, sin singleton)', () => {
    for (const file of [
      'src/db/admin-identity-repository.ts',
      'src/db/admin-content-repository.ts',
    ]) {
      const source = readFileSync(resolve(process.cwd(), file), 'utf-8');
      expect(source).toContain('Fábrica del repositorio');
      expect(source).not.toContain('Instancia única');
      // La fábrica crea un objeto nuevo por llamada.
      expect(source).toMatch(/function get\w+Repository\(\)[\s\S]*?return new /);
    }
  });
});

describe('limpieza · claves de rol validadas sin casts silenciosos', () => {
  it('assertRoleKey acepta las seis claves y rechaza desconocidas', () => {
    for (const key of ['owner', 'admin', 'editor', 'operador', 'moderador', 'lector']) {
      expect(assertRoleKey(key)).toBe(key);
    }
    expect(() => assertRoleKey('root')).toThrow(/Clave de rol desconocida/);
    expect(() => assertRoleKey('')).toThrow();
  });

  it('el mapeo de filas valida la clave en runtime (casts controlados tras validar)', () => {
    const repo = readFileSync(
      resolve(process.cwd(), 'src/db/admin-identity-repository.ts'),
      'utf-8',
    );
    // La clave se valida en runtime antes de tiparla; no hay fallback
    // silencioso que conceda capacidades vacías a claves desconocidas.
    expect(repo).toContain('const key = assertRoleKey(row.key)');
    expect(repo).not.toMatch(/ROLE_CAPABILITIES\[[^\]]*\] \?\?/);
  });
});
