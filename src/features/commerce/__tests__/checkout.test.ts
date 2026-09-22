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

  it('resuelve una URL externa de Shopify sin conocer detalles del proveedor, y declara que no lleva el carrito', async () => {
    const result = await createCheckoutGateway({
      mode: 'external_shopify',
      externalShopifyUrl: 'https://tueste.myshopify.com',
    }).start(ITEMS);

    expect(result).toEqual({
      kind: 'redirect',
      provider: 'external_shopify',
      url: 'https://tueste.myshopify.com',
      cartPreserved: false,
    });
  });

  it('encapsula la llamada legacy y devuelve un resultado tipado que sí preserva el carrito', async () => {
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
      cartPreserved: true,
    });
    expect(fetch).toHaveBeenCalledWith(
      '/api/checkout',
      expect.objectContaining({ method: 'POST' }),
    );
    vi.unstubAllGlobals();
  });

  it('devuelve kind: "login" cuando el backend responde 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Inicia sesion para pagar.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const result = await createCheckoutGateway({
      mode: 'mercadopago_legacy',
      externalShopifyUrl: null,
    }).start(ITEMS);

    expect(result).toEqual({
      kind: 'login',
      message: 'Inicia sesión con tu cuenta Tueste para continuar con el pago.',
    });
    vi.unstubAllGlobals();
  });

  it('devuelve kind: "error" cuando la respuesta no es ok o el cuerpo está malformado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'El carrito no es valido.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const result = await createCheckoutGateway({
      mode: 'mercadopago_legacy',
      externalShopifyUrl: null,
    }).start(ITEMS);

    expect(result).toEqual({ kind: 'error', message: 'El carrito no es valido.' });
    vi.unstubAllGlobals();
  });

  it('devuelve kind: "error" con mensaje genérico si el cuerpo no trae checkoutUrl ni message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('not-json', {
          status: 502,
          headers: { 'Content-Type': 'text/plain' },
        }),
      ),
    );

    const result = await createCheckoutGateway({
      mode: 'mercadopago_legacy',
      externalShopifyUrl: null,
    }).start(ITEMS);

    expect(result).toEqual({
      kind: 'error',
      message: 'No fue posible iniciar el pago. Inténtalo de nuevo.',
    });
    vi.unstubAllGlobals();
  });

  it('devuelve kind: "error" cuando fetch lanza una excepción (sin conexión)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const result = await createCheckoutGateway({
      mode: 'mercadopago_legacy',
      externalShopifyUrl: null,
    }).start(ITEMS);

    expect(result).toEqual({
      kind: 'error',
      message: 'No pudimos conectar con el servicio de pagos. Inténtalo de nuevo.',
    });
    vi.unstubAllGlobals();
  });
});
