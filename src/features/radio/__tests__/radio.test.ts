import { describe, expect, it } from 'vitest';
import { RADIO_PLANS, suscripcionMensaje } from '../index';

describe('feature radio', () => {
  it('expone los tres planes B2B del mockup con su precio', () => {
    expect(RADIO_PLANS.map((p) => p.nombre)).toEqual([
      'Señal Origen',
      'Diseñada por Tueste',
      'Totalmente Personalizada',
    ]);
    expect(RADIO_PLANS.map((p) => p.priceUsd)).toEqual([10, 20, 30]);
  });

  it('solo el plan «Diseñada por Tueste» está destacado', () => {
    const destacados = RADIO_PLANS.filter((p) => p.destacado);
    expect(destacados).toHaveLength(1);
    expect(destacados[0].nombre).toBe('Diseñada por Tueste');
  });

  it('cada plan tiene acento válido, tag y beneficios no vacíos', () => {
    const acentos = ['teal', 'amber', 'coral'] as const;
    for (const p of RADIO_PLANS) {
      expect(acentos, `acento de ${p.id}`).toContain(p.accent);
      expect(p.tag.length).toBeGreaterThan(0);
      expect(p.features.length).toBeGreaterThanOrEqual(4);
      for (const f of p.features) {
        expect(f.length).toBeGreaterThan(0);
      }
    }
  });

  it('los beneficios encadenan de plan en plan', () => {
    const [senal, disenada, personalizada] = RADIO_PLANS;
    expect(disenada.features[0]).toContain('Señal Origen');
    expect(personalizada.features[0]).toContain('Diseñada por Tueste');
    expect(senal.features[0]).not.toContain('Todo lo del plan');
  });

  it('el mensaje de suscripción anuncia la confirmación futura sin canales externos', () => {
    const msg = suscripcionMensaje(RADIO_PLANS[1]);
    expect(msg).toContain('Diseñada por Tueste');
    expect(msg).toContain('USD 20/mes');
    expect(msg).toContain('se habilitarán cuando el cliente confirme el flujo');
    expect(msg).not.toMatch(/whatsapp|wa\.me|\+57|tel:/i);
  });
});
