import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ASSET_STATUS_FLOW,
  ASSET_SCHEMA,
  CONTENT_DRAFT_SCHEMA,
  CONTENT_STATUS_SCHEMA,
  CONTENT_STATUS_FLOW,
  RELEASE_SCHEMA,
  SCHEDULE_SCHEMA,
  STATUS_TRANSITION_SCHEMA,
  canTransitionAsset,
  canTransitionContent,
  localDateTimeWithOffset,
} from '../content-schemas';
import { ROLE_CAPABILITIES } from '../permissions';

/**
 * Pruebas de los contratos de contenido (Fase 2): validación Zod,
 * transiciones de estado y capacidades por rol.
 */

describe('contenido · validación Zod', () => {
  it('acepta un borrador válido', () => {
    const parsed = CONTENT_DRAFT_SCHEMA.parse({
      title: 'El origen sonoro',
      slug: 'el-origen-sonoro',
      body: 'Texto editorial.',
    });
    expect(parsed.slug).toBe('el-origen-sonoro');
  });

  it('rechaza slugs inválidos y títulos vacíos', () => {
    expect(() => CONTENT_DRAFT_SCHEMA.parse({ title: 'X', slug: 'Slug Con Mayúsculas' })).toThrow();
    expect(() => CONTENT_DRAFT_SCHEMA.parse({ title: '', slug: 'ok' })).toThrow();
  });

  it('la transición de estado exige razón (mínimo 3, máximo 300)', () => {
    const ok = STATUS_TRANSITION_SCHEMA.parse({
      from: 'draft',
      to: 'review',
      reason: 'Envío a revisión editorial',
    });
    expect(ok.to).toBe('review');
    expect(() =>
      STATUS_TRANSITION_SCHEMA.parse({ from: 'draft', to: 'review', reason: 'ab' }),
    ).toThrow();
    expect(() =>
      STATUS_TRANSITION_SCHEMA.parse({ from: 'draft', to: 'review', reason: 'x'.repeat(301) }),
    ).toThrow();
  });

  it('los assets validan MIME, tamaño y estado', () => {
    expect(
      ASSET_SCHEMA.parse({
        storageKey: 'contenido/portada.webp',
        filename: 'portada.webp',
        mimeType: 'image/webp',
        sizeBytes: 1000,
      }).status,
    ).toBe('pending');
    expect(() =>
      ASSET_SCHEMA.parse({
        storageKey: 'k',
        filename: 'f',
        mimeType: 'image/webp',
        sizeBytes: -1,
      }),
    ).toThrow();
  });

  it('acepta el slug lanzamiento-tueste-2026 (lanzamiento)', () => {
    const parsed = RELEASE_SCHEMA.parse({
      title: 'Lanzamiento Tueste 2026',
      slug: 'lanzamiento-tueste-2026',
    });
    expect(parsed.slug).toBe('lanzamiento-tueste-2026');
  });

  it('normaliza caracteres ocultos en el slug (guiones largos, espacios, mayúsculas)', () => {
    expect(
      RELEASE_SCHEMA.parse({
        title: 'X',
        slug: '  Lanzamiento–tueste—2026 ',
      }).slug,
    ).toBe('lanzamiento-tueste-2026');
    expect(
      CONTENT_DRAFT_SCHEMA.parse({
        title: 'X',
        slug: 'el origen sonoro',
      }).slug,
    ).toBe('el-origen-sonoro');
  });

  it('rechaza slugs con caracteres inválidos tras la normalización', () => {
    expect(() => RELEASE_SCHEMA.parse({ title: 'X', slug: 'lanzamiento_tueste' })).toThrow();
    expect(() => RELEASE_SCHEMA.parse({ title: 'X', slug: 'Lanzamiento ñ' })).toThrow();
  });

  it('los releases validan sus pistas', () => {
    const release = RELEASE_SCHEMA.parse({
      title: 'Coffee in Frequencies',
      slug: 'coffee-in-frequencies',
      tracks: [{ title: 'Origen 111 Hz', hz: 111 }],
    });
    expect(release.tracks).toHaveLength(1);
    expect(() =>
      RELEASE_SCHEMA.parse({ title: 'X', slug: 'x', tracks: [{ title: '', hz: 111 }] }),
    ).toThrow();
  });

  it('la programación exige una fecha futura y una razón auditada', () => {
    const future = new Date(Date.now() + 60_000);
    expect(
      SCHEDULE_SCHEMA.parse({ scheduledAt: future.toISOString(), reason: 'Campaña editorial' })
        .scheduledAt,
    ).toEqual(future);
    expect(() =>
      SCHEDULE_SCHEMA.parse({
        scheduledAt: new Date(Date.now() - 60_000).toISOString(),
        reason: 'Campaña editorial',
      }),
    ).toThrow('La fecha debe estar en el futuro.');
  });

  it('convierte la hora local del navegador a UTC sin depender del timezone del servidor', () => {
    expect(localDateTimeWithOffset('2026-09-01T09:30', 300).toISOString()).toBe(
      '2026-09-01T14:30:00.000Z',
    );
    expect(localDateTimeWithOffset('2026-09-01T09:30', -120).toISOString()).toBe(
      '2026-09-01T07:30:00.000Z',
    );
  });
});

describe('contenido · transiciones de estado', () => {
  it('valida estados conocidos y rechaza estados corruptos', () => {
    expect(CONTENT_STATUS_SCHEMA.parse('published')).toBe('published');
    expect(() => CONTENT_STATUS_SCHEMA.parse('corrupted')).toThrow();
  });

  it('el flujo de contenido es borrador → revisión → publicado → archivado', () => {
    expect(CONTENT_STATUS_FLOW).toEqual([
      ['draft', 'review'],
      ['review', 'published'],
      ['review', 'draft'],
      ['published', 'archived'],
      ['draft', 'archived'],
    ]);
    expect(canTransitionContent('draft', 'review')).toBe(true);
    expect(canTransitionContent('review', 'published')).toBe(true);
    expect(canTransitionContent('published', 'archived')).toBe(true);
    expect(canTransitionContent('published', 'draft')).toBe(false);
    expect(canTransitionContent('archived', 'published')).toBe(false);
  });

  it('el flujo de activos es pendiente → aprobado → archivado', () => {
    expect(ASSET_STATUS_FLOW).toEqual([
      ['pending', 'approved'],
      ['pending', 'archived'],
      ['approved', 'archived'],
    ]);
    expect(canTransitionAsset('pending', 'approved')).toBe(true);
    expect(canTransitionAsset('approved', 'pending')).toBe(false);
  });
});

describe('contenido · permisos por rol', () => {
  it('content.read está en los roles con lectura editorial', () => {
    for (const rol of ['owner', 'admin', 'editor', 'lector']) {
      expect(ROLE_CAPABILITIES[rol as keyof typeof ROLE_CAPABILITIES]).toContain('content.read');
    }
    // Operador y moderador no gestionan contenido (CRM/eventos/tree y
    // comunidad respectivamente).
    expect(ROLE_CAPABILITIES.operador).not.toContain('content.read');
    expect(ROLE_CAPABILITIES.moderador).not.toContain('content.read');
  });

  it('content.publish solo para owner y admin', () => {
    expect(ROLE_CAPABILITIES.owner).toContain('content.publish');
    expect(ROLE_CAPABILITIES.admin).toContain('content.publish');
    expect(ROLE_CAPABILITIES.editor).not.toContain('content.publish');
    expect(ROLE_CAPABILITIES.operador).not.toContain('content.publish');
    expect(ROLE_CAPABILITIES.moderador).not.toContain('content.publish');
    expect(ROLE_CAPABILITIES.lector).not.toContain('content.publish');
  });

  it('content.edit para editor (sin publicar)', () => {
    expect(ROLE_CAPABILITIES.editor).toContain('content.edit');
    expect(ROLE_CAPABILITIES.editor).toContain('content.read');
  });
});

describe('contenido · frontera server-only y repositorios', () => {
  const FILES = [
    'src/db/admin-content-repository.ts',
    'src/features/admin/content-service.ts',
    'src/db/schema/admin-content.ts',
  ];

  it('los módulos de contenido no filtran secretos ni exponen el cliente', () => {
    for (const file of FILES) {
      const source = readFileSync(resolve(process.cwd(), file), 'utf-8');
      const codigo = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      for (const patron of [
        'process.env',
        'DATABASE_URL',
        'NEXT_PUBLIC',
        'service_role',
        'anon key',
        'supabase',
      ]) {
        expect(codigo.toLowerCase(), `${file} no debe contener ${patron}`).not.toContain(
          patron.toLowerCase(),
        );
      }
    }
  });

  it('content-service y el repositorio son server-only', () => {
    const service = readFileSync(
      resolve(process.cwd(), 'src/features/admin/content-service.ts'),
      'utf-8',
    );
    const repo = readFileSync(
      resolve(process.cwd(), 'src/db/admin-content-repository.ts'),
      'utf-8',
    );
    expect(service.startsWith("import 'server-only';")).toBe(true);
    expect(repo.startsWith("import 'server-only';")).toBe(true);
  });
});
