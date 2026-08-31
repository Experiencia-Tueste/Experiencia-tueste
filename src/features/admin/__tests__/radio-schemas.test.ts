import { describe, expect, it } from 'vitest';
import { RADIO_CHANNEL_SCHEMA, RADIO_COMPANY_SCHEMA, isRadioStatusChange } from '../radio-schemas';
describe('admin · radio', () => {
  it('normaliza el correo de la empresa', () => {
    expect(
      RADIO_COMPANY_SCHEMA.parse({
        name: 'Café',
        contactName: 'Ana',
        contactEmail: ' ANA@CAFE.CO ',
        city: 'Bogotá',
        reason: 'Alta comercial',
      }).contactEmail,
    ).toBe('ana@cafe.co');
  });
  it('restringe el plan al catálogo público', () => {
    expect(() =>
      RADIO_CHANNEL_SCHEMA.parse({
        companyId: 'a3f8b6c2-9d4e-4f1a-8b7c-2d5e6f7a8b9c',
        name: 'Lobby',
        planId: 'inventado',
        reason: 'Alta canal',
      }),
    ).toThrow();
  });
  it('detecta cambios reales de estado', () => {
    expect(isRadioStatusChange('pending', 'pending')).toBe(false);
    expect(isRadioStatusChange('pending', 'trial')).toBe(true);
  });
});
