import { describe, expect, it } from 'vitest';
import {
  AVISO_MERCADO,
  MERCADO_ACCENT,
  MERCADO_ITEMS,
  MERCADO_PASOS,
  MERCADO_TIPOS,
  consultaMensaje,
  esTipoValido,
  parsearPrecio,
  publicacionMensaje,
} from '../index';

describe('feature mercado', () => {
  it('expone el catálogo demo del mockup con marca, tipo, origen y precio', () => {
    expect(MERCADO_ITEMS.map((i) => i.marca)).toEqual([
      'Finca La Aurora',
      'Verde Andino',
      'Molino Cauca',
    ]);
    expect(MERCADO_ITEMS.map((i) => i.tipo)).toEqual([
      'Café tostado',
      'Café en verde',
      'Métodos & accesorios',
    ]);
    expect(MERCADO_ITEMS.map((i) => i.origen)).toEqual(['Huila', 'Nariño', 'Cauca']);
    expect(MERCADO_ITEMS.map((i) => i.precio)).toEqual([42000, 980000, 155000]);
  });

  it('todos los ítems del catálogo son demostrativos y tienen descripción', () => {
    for (const item of MERCADO_ITEMS) {
      expect(item.demo, `demo de ${item.marca}`).toBe(true);
      expect(item.descripcion.length).toBeGreaterThan(0);
    }
  });

  it('expone los tres pasos del modelo de venta directa', () => {
    expect(MERCADO_PASOS.map((p) => p.titulo)).toEqual(['Regístrate', 'Publica', 'Vende directo']);
    expect(MERCADO_PASOS.map((p) => p.num)).toEqual(['1', '2', '3']);
    for (const paso of MERCADO_PASOS) {
      expect(paso.texto.length).toBeGreaterThan(0);
      expect(paso.texto).not.toMatch(/whatsapp|wa\.me|\+57|tel:/i);
    }
  });

  it('cada tipo del catálogo tiene un acento válido', () => {
    const acentos = ['amber', 'coral', 'teal', 'purple'] as const;
    for (const tipo of MERCADO_TIPOS) {
      expect(acentos, `acento de ${tipo}`).toContain(MERCADO_ACCENT[tipo]);
    }
  });

  it('«Café tostado» usa el acento ámbar del mockup', () => {
    expect(MERCADO_ACCENT['Café tostado']).toBe('amber');
  });

  it('valida tipos del formulario contra el catálogo', () => {
    expect(esTipoValido('Café tostado')).toBe(true);
    expect(esTipoValido('Métodos & accesorios')).toBe(true);
    expect(esTipoValido('Té')).toBe(false);
  });

  it('parsea precios escritos con separadores de miles', () => {
    expect(parsearPrecio('48.000')).toBe(48000);
    expect(parsearPrecio('48000')).toBe(48000);
    expect(parsearPrecio('1.250.000')).toBe(1250000);
    expect(parsearPrecio('')).toBeNull();
    expect(parsearPrecio('abc')).toBeNull();
    expect(parsearPrecio('0')).toBeNull();
  });

  it('el mensaje de compra anuncia la consulta futura sin canales externos', () => {
    const msg = consultaMensaje(MERCADO_ITEMS[0]);
    expect(msg).toContain('Finca La Aurora');
    expect(msg).toContain('Café tostado');
    expect(msg).toContain('Huila');
    expect(msg).toContain('cuando el cliente confirme el flujo');
    expect(msg).not.toMatch(/whatsapp|wa\.me|\+57|tel:/i);
  });

  it('el mensaje de vista previa local no promete publicación real', () => {
    const msg = publicacionMensaje(
      {
        marca: 'Finca El Roble',
        tipo: 'Café tostado',
        origen: 'Quindío',
        precio: 48000,
        descripcion: '',
      },
      'COP 48.000',
    );
    expect(msg).toContain('Vista previa local');
    expect(msg).toContain('Finca El Roble');
    expect(msg).toContain('COP 48.000');
    expect(msg).toContain('No se envió ni se guardó');
    expect(msg).not.toMatch(/whatsapp|wa\.me|\+57|tel:/i);
  });

  it('el aviso visible usa la frase exacta del plan', () => {
    expect(AVISO_MERCADO).toBe(
      'Las publicaciones y la operación comercial se habilitarán cuando el cliente confirme el flujo.',
    );
  });
});
