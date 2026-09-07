import { describe, expect, it, vi } from 'vitest';
import { createCheckoutGateway, DEFAULT_CHECKOUT_CONFIG } from '../checkout';

const ITEMS = [{ productId: 'cafe-lote-000', qty: 1 }];

describe('checkout gateway', () => {
  it('mantiene disabled sin intentar ningún proveedor', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await createCheckoutGateway(DEFAULT_CHECKOUT_CONFIG).start(ITEMS);

    expect(result).toEqual({
      kind: 'disabled',
      message: 'El checkout está desactivado por ahora. Tu selección quedó guardada.',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('resuelve una URL externa de Shopify sin conocer detalles del proveedor', async () => {
    const result = await createCheckoutGateway({
      mode: 'external_shopify',
      externalShopifyUrl: 'https://tueste.myshopify.com',
    }).start(ITEMS);

    expect(result).toEqual({
      kind: 'redirect',
      provider: 'external_shopify',
      url: 'https://tueste.myshopify.com',
    });
  });

  it('encapsula la llamada legacy y devuelve un resultado tipado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ checkoutUrl: 'https://checkout.example.test/abc' }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const result = await createCheckoutGateway({
      mode: 'mercadopago_legacy',
      externalShopifyUrl: null,
    }).start(ITEMS);

    expect(result).toEqual({
      kind: 'redirect',
      provider: 'mercadopago_legacy',
      url: 'https://checkout.example.test/abc',
    });
    expect(fetch).toHaveBeenCalledWith(
      '/api/checkout',
      expect.objectContaining({ method: 'POST' }),
    );
    vi.unstubAllGlobals();
  });
});
