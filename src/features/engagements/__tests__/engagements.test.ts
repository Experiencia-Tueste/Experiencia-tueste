import { describe, expect, it } from 'vitest';
import { engagementInputSchema, engagementMessage, engagementStatusSchema } from '../index';

describe('feature engagements', () => {
  it('solo acepta tipos, referencias y detalles acotados', () => {
    expect(
      engagementInputSchema.parse({ type: 'event', reference: 'ritual-adopcion-001' }),
    ).toEqual({ type: 'event', reference: 'ritual-adopcion-001' });
    expect(() => engagementInputSchema.parse({ type: 'payment', reference: 'x' })).toThrow();
    expect(() => engagementInputSchema.parse({ type: 'event', reference: '' })).toThrow();
  });

  it('distingue una solicitud nueva de una ya existente sin prometer una activación', () => {
    expect(engagementMessage('radio', true)).toContain('Recibimos tu solicitud');
    expect(engagementMessage('radio', false)).toContain('Ya teníamos registrada');
    expect(engagementMessage('event', true)).toContain('antes de confirmar una reserva');
    expect(engagementMessage('radio', true)).not.toMatch(/pago|suscripción activa/i);
  });

  it('valida una transición trazable para el equipo administrativo', () => {
    expect(
      engagementStatusSchema.parse({
        id: 'a3f8b6c2-9d4e-4f1a-8b7c-2d5e6f7a8b9c',
        from: 'pending',
        to: 'contacted',
        reason: 'Se confirmó el primer contacto.',
      }),
    ).toMatchObject({ from: 'pending', to: 'contacted' });
    expect(() =>
      engagementStatusSchema.parse({
        id: 'not-a-uuid',
        from: 'pending',
        to: 'closed',
        reason: 'ok',
      }),
    ).toThrow();
  });
});
