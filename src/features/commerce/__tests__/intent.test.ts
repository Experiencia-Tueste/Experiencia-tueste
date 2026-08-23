import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COMMERCIAL_INTENTS, INTENT_PREFIX, intentId } from '../intent';

/**
 * Pruebas del contrato de intención comercial (puro y determinista) y
 * de la ausencia de patrones prohibidos en las acciones comerciales.
 */

const INTENT_SOURCE = readFileSync(resolve(__dirname, '../intent.ts'), 'utf-8');

describe('commerce · contrato CommercialIntent', () => {
  it('es puro y determinista (sin React, red, pagos ni browser APIs)', () => {
    expect(intentId('merchandise', 'vinilo')).toBe('merch-vinilo');
    expect(intentId('release', 'from-coffee-to-frequencies')).toBe(
      'release-from-coffee-to-frequencies',
    );
    expect(intentId('tree-adoption', 'drop-000')).toBe('tree-drop-000');

    for (const patron of [
      'from ',
      'import React',
      'fetch(',
      'process.env',
      'localStorage',
      'sessionStorage',
      'window.',
      'document.',
      'Math.random',
      'Date.now',
    ]) {
      expect(INTENT_SOURCE, `intent.ts no debe contener ${patron}`).not.toContain(patron);
    }
  });

  it('los prefijos por clase son estables', () => {
    expect(INTENT_PREFIX.release).toBe('release-');
    expect(INTENT_PREFIX.merchandise).toBe('merch-');
    expect(INTENT_PREFIX['tree-adoption']).toBe('tree-');
    expect(INTENT_PREFIX.availability).toBe('availability-');
  });

  it('expone el intent canónico del Drop 000', () => {
    expect(COMMERCIAL_INTENTS['tree-drop-000']).toMatchObject({
      id: 'tree-drop-000',
      kind: 'tree-adoption',
      status: 'informational',
    });
  });
});

describe('commerce · ausencia de pagos e integraciones', () => {
  it('el contrato no referencia Mercado Pago, endpoints, secretos ni SDKs', () => {
    for (const patron of [
      'mercadopago',
      'Mercado Pago',
      'NEXT_PUBLIC',
      'api/',
      'webhook',
      'access_token',
    ]) {
      expect(INTENT_SOURCE.toLowerCase(), `no debe contener ${patron}`).not.toContain(
        patron.toLowerCase(),
      );
    }
  });
});
