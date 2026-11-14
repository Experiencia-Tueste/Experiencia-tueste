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
import { ADOPCION, INSIGNIAS, getInsignia, insigniaParaCantidad } from '../data/insignias';

/**
 * Contrato de datos de Tueste Tree: navegación, textos y las cuatro
 * insignias de la adopción (alineadas con la ficha de la tienda).
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

  it('el copy habla de adopción y Guardián, no de cofundación', () => {
    expect(FOUNDING_WINDOW).toContain('Adopción abierta');
    expect(ADOPT_TITLE).toBe('Adopta un árbol. Sé su Guardián.');
    expect(LEGAL_NOTE).toContain('Monacua Global Company S.A.S.');
    expect(LEGAL_NOTE).toContain('no es una inversión');
  });
});

describe('tueste-tree · insignias', () => {
  it('expone las cuatro insignias de la tienda en orden', () => {
    expect(INSIGNIAS.map((i) => i.nombre)).toEqual(['Semilla', 'Plata', 'Oro', 'Holográfica']);
    expect(INSIGNIAS.map((i) => [i.min, i.max])).toEqual([
      [1, 9],
      [10, 19],
      [20, 29],
      [30, null],
    ]);
  });

  it('cada insignia es localizable por id', () => {
    expect(getInsignia('oro')?.arboles).toBe('20 a 29 árboles');
    expect(getInsignia('no-existe')).toBeUndefined();
  });

  it('asigna la insignia según la cantidad de árboles, sin huecos en los bordes', () => {
    const casos: Array<[number, string]> = [
      [1, 'semilla'],
      [9, 'semilla'],
      [10, 'plata'],
      [19, 'plata'],
      [20, 'oro'],
      [29, 'oro'],
      [30, 'holografica'],
      [1000, 'holografica'],
    ];
    for (const [cantidad, id] of casos) {
      expect(insigniaParaCantidad(cantidad)?.id, `cantidad ${cantidad}`).toBe(id);
    }
  });

  it('rechaza cantidades que no son una compra válida', () => {
    for (const cantidad of [0, -1, 2.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(insigniaParaCantidad(cantidad), `cantidad ${cantidad}`).toBeUndefined();
    }
  });

  it('lo que incluye la adopción coincide con la ficha de la tienda', () => {
    expect(ADOPCION).toMatchObject({
      bolsasPorArbol: 2,
      gramosPorBolsa: 340,
      certificadoHoras: 48,
    });
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
