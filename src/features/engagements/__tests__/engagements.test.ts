import { describe, expect, it } from 'vitest';
import {
  engagementInputSchema,
  engagementMessage,
  engagementStatusSchema,
  radioOpportunityStageSchema,
} from '../index';

describe('feature engagements', () => {
  it('valida contratos especializados y payloads estructurados', () => {
    expect(
      engagementInputSchema.parse({
        type: 'event',
        reference: 'a3f8b6c2-9d4e-4f1a-8b7c-2d5e6f7a8b9c',
        payload: { attendeeCount: 2, consent: true },
      }),
    ).toMatchObject({
      type: 'event',
      reference: 'a3f8b6c2-9d4e-4f1a-8b7c-2d5e6f7a8b9c',
      payload: { attendeeCount: 2, consent: true },
    });
    expect(
      engagementInputSchema.parse({
        type: 'community',
        reference: 'membership',
        payload: { preferences: ['events', 'coffee'], consent: true },
      }),
    ).toMatchObject({ payload: { preferences: ['events', 'coffee'], consent: true } });
    expect(() => engagementInputSchema.parse({ type: 'payment', reference: 'x' })).toThrow();
    expect(() =>
      engagementInputSchema.parse({
        type: 'event',
        reference: 'not-a-uuid',
        payload: { attendeeCount: 1, consent: true },
      }),
    ).toThrow();
    expect(() =>
      engagementInputSchema.parse({
        type: 'event',
        reference: 'a3f8b6c2-9d4e-4f1a-8b7c-2d5e6f7a8b9c',
        payload: { attendeeCount: 21, consent: true },
      }),
    ).toThrow();
    expect(() =>
      engagementInputSchema.parse({
        type: 'community',
        reference: 'membership',
        payload: { preferences: ['events'] },
      }),
    ).toThrow();
  });

  it('distingue una solicitud nueva de una ya existente sin prometer una activación', () => {
    expect(engagementMessage('radio', true)).toContain('Recibimos tu solicitud');
    expect(engagementMessage('radio', false)).toContain('Ya teníamos registrada');
    expect(engagementMessage('event', true)).toContain('antes de confirmar una reserva');
    expect(engagementMessage('radio', true)).not.toMatch(/pago|suscripción activa/i);
  });

  it('valida los datos mínimos de una oportunidad B2B de Radio', () => {
    expect(
      engagementInputSchema.parse({
        type: 'radio',
        reference: 'disenada',
        payload: {
          company: 'Café Norte',
          responsible: 'Ana',
          city: 'Bogotá',
          businessType: 'Café',
          locations: 2,
          hours: '8:00–18:00',
          consent: true,
        },
      }),
    ).toMatchObject({ type: 'radio', payload: { company: 'Café Norte', locations: 2 } });
    expect(() =>
      engagementInputSchema.parse({
        type: 'radio',
        reference: 'senal',
        payload: {
          company: 'Café Norte',
          responsible: 'Ana',
          city: 'Bogotá',
          businessType: 'Café',
          locations: 2,
          hours: '8:00–18:00',
        },
      }),
    ).toThrow();
    expect(
      radioOpportunityStageSchema.parse({
        id: 'a3f8b6c2-9d4e-4f1a-8b7c-2d5e6f7a8b9c',
        from: 'new',
        to: 'qualified',
        reason: 'Se validó el perfil comercial.',
      }),
    ).toMatchObject({ from: 'new', to: 'qualified' });
  });

  it('valida una solicitud de vendedor con responsable y consentimiento', () => {
    expect(
      engagementInputSchema.parse({
        type: 'market',
        reference: 'seller-onboarding',
        payload: {
          intent: 'seller_application',
          brand: 'Finca Roble',
          responsible: 'Luis',
          region: 'Quindío',
          category: 'Café tostado',
          consent: true,
        },
      }),
    ).toMatchObject({ type: 'market', payload: { responsible: 'Luis', consent: true } });
    expect(() =>
      engagementInputSchema.parse({
        type: 'market',
        reference: 'seller-onboarding',
        payload: {
          intent: 'seller_application',
          brand: 'Finca Roble',
          region: 'Quindío',
          category: 'Café tostado',
          consent: true,
        },
      }),
    ).toThrow();
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
