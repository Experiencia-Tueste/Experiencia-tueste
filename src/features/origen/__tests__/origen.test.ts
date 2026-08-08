import { describe, expect, it } from 'vitest';
import { getOrigenPaso, ORIGEN_PASOS } from '../index';
import { getTrack } from '../../audio';

describe('feature origen', () => {
  it('expone los cinco pasos del origen', () => {
    expect(ORIGEN_PASOS).toHaveLength(5);
    expect(ORIGEN_PASOS.map((p) => p.titulo)).toEqual([
      'Germinación',
      'Raíz',
      'Expansión',
      'Tostión',
      'Despertar',
    ]);
  });

  it('busca un paso por id', () => {
    expect(getOrigenPaso('raiz')?.titulo).toBe('Raíz');
    expect(getOrigenPaso('no-existe')).toBeUndefined();
  });

  it('cada paso referencia una pista existente del catálogo', () => {
    for (const paso of ORIGEN_PASOS) {
      expect(getTrack(paso.trackId), `paso ${paso.id} -> pista ${paso.trackId}`).toBeDefined();
    }
  });
});
