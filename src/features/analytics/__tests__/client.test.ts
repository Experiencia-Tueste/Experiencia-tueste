import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('cliente de analítica', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('no repite una señal con la misma clave de deduplicación', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 202 }));
    const { trackAnalytics } = await import('../client');

    await trackAnalytics('cart_opened', { itemCount: 1 }, 'test-dedupe-cart-opened');
    await trackAnalytics('cart_opened', { itemCount: 1 }, 'test-dedupe-cart-opened');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.properties).toEqual({ itemCount: 1 });
    expect(body.properties.email).toBeUndefined();
  });
});
