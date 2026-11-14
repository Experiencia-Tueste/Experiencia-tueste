import { describe, expect, it } from 'vitest';
import {
  ANALYTICS_EVENT_DICTIONARY,
  ANALYTICS_EVENT_NAMES,
  analyticsEventSchema,
} from '../event-contract';

const id = '11111111-1111-4111-8111-111111111111';

describe('contrato de analítica first-party', () => {
  it('mantiene el diccionario completo, versionado y con propietario', () => {
    expect(Object.keys(ANALYTICS_EVENT_DICTIONARY)).toEqual([...ANALYTICS_EVENT_NAMES]);
    expect(Object.values(ANALYTICS_EVENT_DICTIONARY).every((entry) => entry.owner.length > 0)).toBe(
      true,
    );
  });

  it('acepta propiedades tipadas para un evento conocido', () => {
    expect(
      analyticsEventSchema.safeParse({
        eventId: id,
        eventName: 'product_added',
        eventVersion: 1,
        properties: { productId: 'cafe-lote-000', quantity: 1 },
      }).success,
    ).toBe(true);
  });

  it('rechaza PII, texto libre y propiedades desconocidas', () => {
    expect(
      analyticsEventSchema.safeParse({
        eventId: id,
        eventName: 'community_joined',
        eventVersion: 1,
        properties: { preferenceCount: 2, email: 'ana@example.com' },
      }).success,
    ).toBe(false);
    expect(
      analyticsEventSchema.safeParse({
        eventId: id,
        eventName: 'seller_application_submitted',
        eventVersion: 1,
        properties: { comment: 'texto libre' },
      }).success,
    ).toBe(false);
  });
});
