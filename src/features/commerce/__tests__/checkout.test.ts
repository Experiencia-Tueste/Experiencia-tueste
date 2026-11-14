import { describe, expect, it } from 'vitest';
import { CHECKOUT_MODES, DEFAULT_CHECKOUT_CONFIG } from '../checkout';

describe('contrato de checkout', () => {
  it('por defecto no habilita ningún canal de compra', () => {
    expect(DEFAULT_CHECKOUT_CONFIG).toEqual({ mode: 'disabled', externalShopifyUrl: null });
  });

  it('expone exactamente los modos que valida la configuración de servidor', () => {
    expect([...CHECKOUT_MODES]).toEqual([
      'disabled',
      'external_shopify',
      'mercadopago_legacy',
      'shopify',
    ]);
  });
});
