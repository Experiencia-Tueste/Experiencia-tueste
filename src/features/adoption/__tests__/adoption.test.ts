import { describe, expect, it } from 'vitest';
import {
  AVISO_DEMO,
  AVISO_LEGAL,
  BENEFICIOS,
  BITACORA_DEMO,
  DEMO_ADOPCION,
  LOTE_FUNDADOR,
  MENSAJE_ACTIVACION,
  PRECIO_ADOPCION,
} from '../index';
import { BONDS, HERO_IMAGE_SRC, MEMORIES, STAGES } from '../data/adoption-content';

const ICONOS_VALIDOS = ['cert', 'fotos', 'frecuencia', 'cafe'] as const;

describe('feature adoption', () => {
  it('expone el lote fundador con coordenadas y altitud', () => {
    expect(LOTE_FUNDADOR.nombre).toContain('Lote 000');
    expect(LOTE_FUNDADOR.coordenadas).toMatch(/\d+°\d+'?[NS]\s+\d+°\d+'?[EWO]/);
    expect(LOTE_FUNDADOR.ubicacion).toContain('Quindío');
    expect(LOTE_FUNDADOR.altitud).toMatch(/msnm/);
  });

  it('expone el precio visible USD 100', () => {
    expect(PRECIO_ADOPCION.valor).toBe('USD 100');
    expect(PRECIO_ADOPCION.detalle.length).toBeGreaterThan(0);
  });

  it('expone los cuatro beneficios con icono válido', () => {
    expect(BENEFICIOS).toHaveLength(4);
    for (const b of BENEFICIOS) {
      expect(ICONOS_VALIDOS, `icono de ${b.id}`).toContain(b.icono);
      expect(b.titulo.length).toBeGreaterThan(0);
      expect(b.descripcion.length).toBeGreaterThan(0);
    }
  });

  it('el aviso legal declara la adopción simbólica y la operación', () => {
    expect(AVISO_LEGAL).toContain('simbólica, cultural y comunitaria');
    expect(AVISO_LEGAL).toContain('No constituye propiedad');
    expect(AVISO_LEGAL).toContain('inversión financiera');
    expect(AVISO_LEGAL).toContain('Monacua Global Company S.A.S.');
  });

  it('el aviso demo declara explícitamente que es demostrativo', () => {
    expect(AVISO_DEMO).toContain('Panel demostrativo');
    expect(AVISO_DEMO).toContain('no implica propiedad');
  });

  it('el panel demo usa identificadores estáticos marcados como demo', () => {
    expect(DEMO_ADOPCION.esDemo).toBe(true);
    expect(DEMO_ADOPCION.arbolId).toContain('DEMO');
    expect(DEMO_ADOPCION.certificado).toContain('DEMO');
    expect(DEMO_ADOPCION.lote).toContain('Lote 000');
    expect(DEMO_ADOPCION.progreso).toBeGreaterThanOrEqual(0);
    expect(DEMO_ADOPCION.progreso).toBeLessThanOrEqual(100);
  });

  it('la bitácora demo tiene entradas completas y próximas', () => {
    expect(BITACORA_DEMO.length).toBeGreaterThanOrEqual(4);
    expect(BITACORA_DEMO.some((l) => l.hecho)).toBe(true);
    expect(BITACORA_DEMO.some((l) => !l.hecho)).toBe(true);
    for (const l of BITACORA_DEMO) {
      expect(l.cuando.length).toBeGreaterThan(0);
      expect(l.titulo.length).toBeGreaterThan(0);
    }
  });

  it('el mensaje de activación anuncia la confirmación futura sin canales externos', () => {
    expect(MENSAJE_ACTIVACION).toContain('se habilitará cuando el cliente confirme');
    expect(MENSAJE_ACTIVACION).toContain('tratamiento de datos');
    expect(MENSAJE_ACTIVACION).not.toMatch(/whatsapp|wa\.me|\+57|tel:/i);
  });
});

describe('feature adoption · contrato fotográfico de /adopta', () => {
  it('el hero declara su fotografía local', () => {
    expect(HERO_IMAGE_SRC).toBe('/images/adopta/adopta-hero-cafeto-joven-v1.webp');
  });

  it('los tres vínculos tienen imagen local tipada en orden', () => {
    expect(BONDS).toHaveLength(3);
    expect(BONDS.map((bond) => bond.imageSrc)).toEqual([
      '/images/adopta/vinculo-semilla-v1.webp',
      '/images/adopta/vinculo-arbol-joven-v1.webp',
      '/images/adopta/vinculo-arbol-guardian-v1.webp',
    ]);
    for (const bond of BONDS) {
      expect(bond.imageSrc).toMatch(/^\/images\/adopta\//);
      expect(bond.imageAlt.length).toBeGreaterThan(10);
      expect(bond.name.length).toBeGreaterThan(0);
      expect(bond.text.length).toBeGreaterThan(0);
    }
  });

  it('las cinco etapas del ciclo tienen imagen local tipada en orden exacto', () => {
    expect(STAGES.map((stage) => stage.name)).toEqual([
      'Germinación',
      'Floración',
      'Cereza',
      'Cosecha',
      'Tu taza',
    ]);
    expect(STAGES.map((stage) => stage.number)).toEqual(['01', '02', '03', '04', '05']);
    expect(STAGES.map((stage) => stage.imageSrc)).toEqual([
      '/images/adopta/ciclo-germinacion-v1.webp',
      '/images/adopta/ciclo-floracion-v1.webp',
      '/images/adopta/ciclo-cereza-v1.webp',
      '/images/adopta/ciclo-cosecha-v1.webp',
      '/images/adopta/ciclo-taza-v1.webp',
    ]);
    for (const stage of STAGES) {
      expect(stage.phrase.split(' ').length).toBeLessThanOrEqual(12);
      expect(stage.imageAlt.length).toBeGreaterThan(10);
    }
  });

  it('las cuatro memorias tienen imagen local tipada', () => {
    expect(MEMORIES).toHaveLength(4);
    expect(MEMORIES.map((memory) => memory.imageSrc)).toEqual([
      '/images/adopta/memoria-bitacora-v1.webp',
      '/images/adopta/memoria-carta-v1.webp',
      '/images/adopta/memoria-cafe-v1.webp',
      '/images/adopta/memoria-ritual-v1.webp',
    ]);
    for (const memory of MEMORIES) {
      expect(memory.imageSrc).toMatch(/^\/images\/adopta\//);
      expect(memory.imageAlt.length).toBeGreaterThan(10);
      expect(memory.description.length).toBeGreaterThan(10);
    }
  });
});
