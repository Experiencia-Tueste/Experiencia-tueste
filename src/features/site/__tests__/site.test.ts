import { describe, expect, it } from 'vitest';
import {
  FOOTER_ALLOWED_HASHES,
  FOOTER_CIERRE,
  FOOTER_COPYRIGHT,
  FOOTER_GROUPS,
  FOOTER_PALETA,
  PUBLIC_SECTIONS,
  SECTION_IDS,
  esHashInterno,
  getSection,
  sectionsIn,
} from '../index';
import type { SectionId } from '../index';

describe('feature site · contrato de secciones', () => {
  it('SECTION_IDS centraliza los diez hashes públicos sin duplicados', () => {
    const valores = Object.values(SECTION_IDS);
    expect(valores).toHaveLength(10);
    expect(new Set(valores).size).toBe(valores.length);
    for (const v of valores) {
      expect(v).toMatch(/^#[a-z-]+$/);
    }
  });

  it('todos los ids de PUBLIC_SECTIONS provienen de SECTION_IDS', () => {
    const valores = Object.values(SECTION_IDS);
    for (const s of PUBLIC_SECTIONS) {
      expect(valores).toContain(s.id);
    }
    expect(new Set(PUBLIC_SECTIONS.map((s) => s.id)).size).toBe(PUBLIC_SECTIONS.length);
  });

  it('un hash inexistente no es asignable a SectionId (comprobación de tipos)', () => {
    // @ts-expect-error — '#no-existe' no es un valor de SECTION_IDS
    const invalido: SectionId = '#no-existe';
    expect(invalido).toBe('#no-existe');
    expect(esHashInterno('#no-existe')).toBe(false);
  });

  it('todos los hashes son únicos y corresponden a secciones públicas', () => {
    const ids = PUBLIC_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^#[a-z-]+$/);
      expect(getSection(id)).toBeDefined();
    }
  });

  it('el navbar desktop conserva etiquetas, destinos y orden exactos', () => {
    const desktop = sectionsIn('desktop');
    expect(desktop.map((s) => s.label)).toEqual([
      'Escucha',
      'Origen',
      'Música',
      'Barista',
      'En Vivo',
      'Adopta',
      'Tienda',
      'Negocios',
      'Comunidad',
    ]);
    expect(desktop.map((s) => s.id)).toEqual([
      SECTION_IDS.escucha,
      SECTION_IDS.origen,
      SECTION_IDS.musica,
      SECTION_IDS.barista,
      SECTION_IDS.enVivo,
      SECTION_IDS.adopta,
      SECTION_IDS.tienda,
      SECTION_IDS.negocios,
      SECTION_IDS.comunidad,
    ]);
    for (const s of desktop) {
      expect(getSection(s.id)).toBeDefined();
    }
  });

  it('el menú móvil conserva la numeración 01–07 y 10', () => {
    const mobile = sectionsIn('mobile');
    expect(mobile.map((s) => s.num)).toEqual(['01', '02', '03', '04', '05', '06', '07', '·', '10']);
    expect(mobile.map((s) => s.label)).toEqual([
      'Escucha',
      'Origen',
      'Música',
      'Barista',
      'En Vivo',
      'Adopta',
      'Tienda',
      'Negocios',
      'Comunidad',
    ]);
    for (const s of mobile) {
      expect(getSection(s.id)).toBeDefined();
    }
  });

  it('«Mercado de Origen» existe en el contrato pero solo en el footer', () => {
    const mercado = getSection(SECTION_IDS.mercado);
    expect(mercado).toBeDefined();
    expect(mercado?.label).toBe('Mercado de Origen');
    expect(mercado?.places).toEqual(['footer']);
    expect(sectionsIn('desktop').some((s) => s.id === SECTION_IDS.mercado)).toBe(false);
    expect(sectionsIn('mobile').some((s) => s.id === SECTION_IDS.mercado)).toBe(false);
  });

  it('FOOTER_ALLOWED_HASHES se deriva de la fuente y cubre el footer', () => {
    const hashesFooter = FOOTER_GROUPS.flatMap((g) => g.sectionIds);
    expect(new Set(FOOTER_ALLOWED_HASHES)).toEqual(new Set(hashesFooter));
    expect(FOOTER_ALLOWED_HASHES).toHaveLength(8);
    for (const h of FOOTER_ALLOWED_HASHES) {
      expect(esHashInterno(h)).toBe(true);
      expect(getSection(h)).toBeDefined();
    }
  });
});

describe('feature site · footer', () => {
  it('expone tres grupos de navegación con etiquetas no vacías', () => {
    expect(FOOTER_GROUPS).toHaveLength(3);
    expect(FOOTER_GROUPS.map((g) => g.titulo)).toEqual([
      'Escuchar',
      'Ecosistema',
      'Tienda y comunidad',
    ]);
    for (const grupo of FOOTER_GROUPS) {
      expect(grupo.titulo.length).toBeGreaterThan(0);
      expect(grupo.sectionIds.length).toBeGreaterThan(0);
    }
  });

  it('todos los enlaces del footer son hashes internos permitidos', () => {
    const todos = FOOTER_GROUPS.flatMap((g) => g.sectionIds);
    for (const id of todos) {
      expect(esHashInterno(id), `href inválido: ${id}`).toBe(true);
      expect(FOOTER_ALLOWED_HASHES).toContain(id);
      expect(getSection(id)?.label.length).toBeGreaterThan(0);
    }
  });

  it('no hay enlaces externos, vacíos ni duplicados dentro del footer', () => {
    const todos = FOOTER_GROUPS.flatMap((g) => g.sectionIds);
    for (const id of todos) {
      expect(id).toMatch(/^#[a-z-]+$/);
      expect(id).not.toBe('#');
    }
    expect(new Set(todos).size).toBe(todos.length);
  });

  it('el copyright usa un año estático (no generado en runtime)', () => {
    expect(FOOTER_COPYRIGHT).toContain('2026');
    expect(FOOTER_COPYRIGHT).toContain('Monacua Global Company S.A.S.');
    expect(FOOTER_COPYRIGHT).toContain('Armenia, Quindío');
    expect(FOOTER_COPYRIGHT).not.toMatch(/\$\{|Date\.|new Date/);
  });

  it('el cierre editorial y la paleta tienen la forma esperada', () => {
    expect(FOOTER_CIERRE).toBe('Donde el café se escucha');
    expect(FOOTER_PALETA).toHaveLength(4);
    for (const color of FOOTER_PALETA) {
      expect(color).toMatch(/^var\(--/);
    }
  });
});
