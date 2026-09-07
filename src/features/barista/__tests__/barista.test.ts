import { describe, expect, it } from 'vitest';
import { getTrack } from '../../audio';
import {
  brewTotalSeconds,
  CHAT_FLOW,
  adjustRecipe,
  EQUIPO,
  INTENCION,
  interpretFreeText,
  METHODS,
  PREF,
  recommend,
  scoreFrequency,
  scoreSensorial,
  TIEMPO_FIT,
} from '../index';
import type { Equipo, Intencion, Sensorial, Tiempo } from '../index';

describe('feature barista', () => {
  it('expone los 7 métodos del mockup', () => {
    expect(METHODS.map((m) => m.name)).toEqual([
      'V60',
      'Chemex',
      'AeroPress',
      'Espresso',
      'Prensa Francesa',
      'Sifón',
      'Tinto de Olleta',
    ]);
  });

  it('cada método referencia una pista de audio existente', () => {
    for (const m of METHODS) {
      expect(getTrack(m.trackId), `método ${m.name} -> pista ${m.trackId}`).toBeDefined();
    }
  });

  it('cada método tiene pasos y al menos uno con temporizador', () => {
    for (const m of METHODS) {
      expect(m.steps.length).toBeGreaterThan(0);
      expect(m.steps.some((s) => s.seconds !== null)).toBe(true);
    }
  });

  it('scoreSensorial devuelve 1 para un perfil idéntico', () => {
    expect(scoreSensorial(METHODS[0].perfil, METHODS[0].perfil)).toBe(1);
  });

  it('respeta el equipo elegido', () => {
    const r = recommend({
      intencion: 'enfoque',
      sensorial: 'equilibrio',
      tiempo: 'medio',
      equipo: 'aeropress',
    });
    expect(r.method.equipo).toBe('aeropress');
  });

  it('con equipo "todos" recomienda algo y ofrece alternativa', () => {
    const r = recommend({
      intencion: 'enfoque',
      sensorial: 'equilibrio',
      tiempo: 'medio',
      equipo: 'todos',
    });
    expect(r.method).toBeDefined();
    expect(r.alternative).toBeDefined();
    expect(r.score).toBeGreaterThan(0);
  });

  it('la intención "energia" favorece métodos intensos', () => {
    const r = recommend({
      intencion: 'energia',
      sensorial: 'cuerpo',
      tiempo: 'rapido',
      equipo: 'todos',
    });
    expect(['Espresso', 'Prensa Francesa']).toContain(r.method.name);
  });

  it('calcula la duración total de una preparación', () => {
    const v60 = METHODS.find((m) => m.id === 'v60')!;
    expect(brewTotalSeconds(v60)).toBe(45 + 30 + 30 + 105);
  });

  it('interpreta una intención libre de forma determinista', () => {
    const interpretation = interpretFreeText('Quiero algo dulce y rápido para concentrarme');

    expect(interpretation.answers).toEqual({
      intencion: 'enfoque',
      sensorial: 'dulzor',
      tiempo: 'rapido',
      equipo: 'todos',
    });
    expect(interpretation.summary).toContain('intención: enfoque');
    expect(interpretation.matched).toHaveLength(4);
  });

  it('calcula frecuencia y playlist explicables para una recomendación', () => {
    expect(scoreFrequency('enfoque', 128)).toBe(1);
    const result = recommend({
      intencion: 'enfoque',
      sensorial: 'equilibrio',
      tiempo: 'medio',
      equipo: 'todos',
    });

    expect(result.playlist.length).toBeGreaterThanOrEqual(3);
    expect(result.playlist.length).toBeLessThanOrEqual(5);
    expect(result.explanation.method).toContain(result.method.name);
    expect(result.explanation.frequency).toContain(`${result.method.freq} Hz`);
  });

  it('aplica ajustes reales sin mutar la receta original', () => {
    const original = METHODS.find((method) => method.id === 'v60')!;
    const adjusted = adjustRecipe(original, 'fuerte');

    expect(adjusted.method.coffee).toBe('22 g');
    expect(adjusted.changes).toContain('dosis +2 g');
    expect(original.coffee).toBe('20 g');
  });

  it('el flujo de consulta tiene cuatro preguntas en orden', () => {
    expect(CHAT_FLOW.map((s) => s.key)).toEqual(['intencion', 'sensorial', 'tiempo', 'equipo']);
  });

  it('todas las opciones del flujo son valores válidos de su tipo', () => {
    for (const paso of CHAT_FLOW) {
      for (const [, value] of paso.options) {
        if (paso.key === 'intencion') {
          expect(INTENCION[value as Intencion], `intención inválida: ${value}`).toBeDefined();
        } else if (paso.key === 'sensorial') {
          expect(PREF[value as Sensorial], `perfil sensorial inválido: ${value}`).toBeDefined();
        } else if (paso.key === 'tiempo') {
          expect(TIEMPO_FIT[value as Tiempo], `tiempo inválido: ${value}`).toBeDefined();
        } else {
          expect(EQUIPO[value as Equipo], `equipo inválido: ${value}`).toBeDefined();
        }
      }
    }
  });

  it('un flujo completo de respuestas produce una recomendación válida', () => {
    const answers = {
      intencion: 'enfoque',
      sensorial: 'equilibrio',
      tiempo: 'medio',
      equipo: 'todos',
    } as const;
    const r = recommend({ ...answers });
    expect(r.method).toBeDefined();
    expect(r.method.steps.length).toBeGreaterThan(0);
    expect(r.alternative).toBeDefined();
  });
});
