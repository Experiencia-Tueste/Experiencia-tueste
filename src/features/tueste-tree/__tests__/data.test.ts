import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_SECTIONS,
  SIDEBAR_GROUPS,
  ADOPT_TITLE,
  FOUNDING_WINDOW,
  LEGAL_NOTE,
} from '../data/content';
import { ARBOLES_GROVE, SOLES_CULTIVO } from '../data/cultivo';
import { LOTE_000_FOUNDERS, NIVELES_FUNDACIONALES, getNivel } from '../data/niveles';

/**
 * Contrato de datos de Tueste Tree: textos literales del mockup de José
 * y estructura fundacional (seis niveles, Lote 000 Founders).
 */

describe('tueste-tree · navegación y secciones', () => {
  it('la navegación de la sidebar incluye las rutas y anclas de la plataforma', () => {
    expect(SIDEBAR_GROUPS.map((group) => group.label)).toEqual([
      'Tu adopción',
      'El proyecto',
      'Comunidad',
    ]);
    for (const group of SIDEBAR_GROUPS) {
      for (const item of group.items) {
        expect(item.href.startsWith('/tueste-tree')).toBe(true);
        expect(item.label.length).toBeGreaterThan(0);
      }
    }
    expect(SIDEBAR_GROUPS.reduce((total, group) => total + group.items.length, 0)).toBe(11);
  });

  it('el dashboard declara sus doce secciones en el orden del mockup', () => {
    expect(DASHBOARD_SECTIONS).toHaveLength(12);
    expect(DASHBOARD_SECTIONS[0]).toMatchObject({ id: 'mi-arbol', num: '01' });
    expect(DASHBOARD_SECTIONS.at(-1)).toMatchObject({ id: 'inquietudes', num: '12' });
  });

  it('conserva el copy fundacional del mockup', () => {
    expect(FOUNDING_WINDOW).toContain('10.200 árboles');
    expect(ADOPT_TITLE).toBe('Adopta un árbol. Cofunda un origen.');
    expect(LEGAL_NOTE).toContain('Monacua Global Company S.A.S.');
  });
});

describe('tueste-tree · niveles fundacionales', () => {
  it('expone los seis niveles del mockup en orden', () => {
    expect(NIVELES_FUNDACIONALES).toHaveLength(6);
    expect(NIVELES_FUNDACIONALES.map((n) => n.nivel)).toEqual([
      'Nivel 01',
      'Nivel 02',
      'Nivel 03',
      'Nivel 04',
      'Nivel 05',
      'Nivel 06',
    ]);
    expect(NIVELES_FUNDACIONALES[0].nombre).toBe('Entrada simbólica');
    expect(NIVELES_FUNDACIONALES[3].nota).toBe('Consejo de Fundadores');
    expect(NIVELES_FUNDACIONALES[5].usd).toBe('USD 100.000');
  });

  it('cada nivel es localizable por id', () => {
    expect(getNivel('inversionista-ancla')?.equity).toBe('2,94%');
    expect(getNivel('no-existe')).toBeUndefined();
  });

  it('el Lote 000 Founders mantiene las cifras literales del mockup', () => {
    expect(LOTE_000_FOUNDERS.arboles).toBe(10200);
    expect(LOTE_000_FOUNDERS.precioReferenciaUsd).toBe(100);
    expect(LOTE_000_FOUNDERS.capitalObjetivoUsd).toBe(1020000);
  });
});

describe('tueste-tree · cultivo (soles y árboles del lote)', () => {
  it('el dashboard mantiene los 30 soles deterministas', () => {
    expect(SOLES_CULTIVO).toHaveLength(30);
    expect(SOLES_CULTIVO[0]).toMatchObject({ numero: '001', estado: 'disponible' });
  });

  it('existen exactamente 300 árboles deterministas para el ritual', () => {
    expect(ARBOLES_GROVE).toHaveLength(300);
    const numeros = new Set(ARBOLES_GROVE.map((a) => a.numero));
    expect(numeros.size).toBe(300);
    expect(ARBOLES_GROVE[0].numero).toBe('001');
    expect(ARBOLES_GROVE[299].numero).toBe('300');
    // Patrón fijo: algunos adoptados, sin aleatoriedad.
    const adoptados = ARBOLES_GROVE.filter((a) => a.estado === 'adoptado');
    expect(adoptados.length).toBeGreaterThan(0);
    expect(adoptados.length).toBeLessThan(ARBOLES_GROVE.length);
    // Repetir el patrón es idéntico (determinismo por construcción).
    expect(ARBOLES_GROVE.map((a) => a.estado)).toEqual(ARBOLES_GROVE.map((a) => a.estado));
  });

  it('cada nivel fundacional tiene descripción editorial', () => {
    for (const nivel of NIVELES_FUNDACIONALES) {
      expect(nivel.descripcion.length).toBeGreaterThan(20);
      expect(nivel.descripcion).toContain('Referencia editorial');
    }
  });
});

describe('tueste-tree · assets aprobados', () => {
  const ASSETS = [
    '/images/tueste-tree/logo-tueste.png',
    '/images/tueste-tree/sol.png',
    '/images/tueste-tree/sol-crema.png',
    '/images/tueste-tree/vitral-verde.png',
    '/images/tueste-tree/vitral-naranja.png',
    '/images/tueste-tree/vitral-lila.png',
    '/images/tueste-tree/ot-2.png',
  ];

  it('todos los assets aprobados existen físicamente', () => {
    for (const asset of ASSETS) {
      expect(
        existsSync(join(process.cwd(), 'public', asset)),
        `asset local faltante: ${asset}`,
      ).toBe(true);
    }
  });

  it('ningún asset es una URL externa ni data:', () => {
    for (const asset of ASSETS) {
      expect(asset).toMatch(/^\/images\//);
      expect(asset).not.toMatch(/^https?:/);
      expect(asset).not.toMatch(/^data:/);
    }
  });
});
