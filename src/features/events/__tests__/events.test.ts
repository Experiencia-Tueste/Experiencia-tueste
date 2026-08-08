import { describe, expect, it } from 'vitest';
import { EVENTS, isReservable, reservaMensaje } from '../index';
import type { EventStatus } from '../index';

const ESTADOS_VALIDOS: readonly EventStatus[] = ['few', 'open', 'wait', 'past'];

describe('feature events', () => {
  it('expone los 4 eventos del mockup en orden editorial', () => {
    expect(EVENTS.map((e) => e.title)).toEqual([
      'Origen Tostado · Ritual de Adopción 001',
      'Cata Sonora · Sesión de escucha',
      'Origen Tostado (live set) · Afro-organic',
      'Coffee in Frequencies · Listening de lanzamiento',
    ]);
  });

  it('cada evento tiene estado válido, CTA y fecha visible', () => {
    for (const e of EVENTS) {
      expect(ESTADOS_VALIDOS, `estado de ${e.id}`).toContain(e.status);
      expect(e.cta.length, `cta de ${e.id}`).toBeGreaterThan(0);
      expect(e.day.length).toBeGreaterThan(0);
      expect(e.month.length).toBeGreaterThan(0);
      expect(e.year.length).toBe(4);
      expect(e.dateTime).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('el evento pasado no es reservable', () => {
    const past = EVENTS.find((e) => e.status === 'past');
    expect(past).toBeDefined();
    expect(isReservable(past!.status)).toBe(false);
  });

  it('los eventos abiertos, con últimos cupos o en espera son reservables', () => {
    for (const e of EVENTS) {
      if (e.status !== 'past') {
        expect(isReservable(e.status), `evento ${e.id}`).toBe(true);
      }
    }
  });

  it('isReservable solo acepta los cuatro estados del contrato', () => {
    expect(isReservable('few')).toBe(true);
    expect(isReservable('open')).toBe(true);
    expect(isReservable('wait')).toBe(true);
    expect(isReservable('past')).toBe(false);
  });

  it('reservaMensaje anuncia el CTA y el título sin canales externos', () => {
    const msg = reservaMensaje(EVENTS[0]);
    expect(msg).toContain(EVENTS[0].cta);
    expect(msg).toContain(EVENTS[0].title);
    expect(msg).toContain(
      'se habilitará cuando el cliente confirme la operación y el canal de contacto',
    );
    expect(msg).not.toMatch(/whatsapp|wa\.me|\+57|tel:/i);
  });
});
