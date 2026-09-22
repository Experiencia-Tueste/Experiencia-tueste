import type { CartItem } from './index';

export const CHECKOUT_MODES = [
  'disabled',
  'external_shopify',
  'mercadopago_legacy',
  'shopify',
] as const;

export type CheckoutMode = (typeof CHECKOUT_MODES)[number];

export interface CheckoutConfig {
  mode: CheckoutMode;
  externalShopifyUrl: string | null;
}

export const DEFAULT_CHECKOUT_CONFIG: CheckoutConfig = {
  mode: 'disabled',
  externalShopifyUrl: null,
};

export type CheckoutResult =
  | {
      kind: 'redirect';
      url: string;
      provider: Exclude<CheckoutMode, 'disabled'>;
      /**
       * Si `false`, la URL de redirect NO lleva el contenido del carrito
       * (productos/cantidades elegidos): el destino ignora `items` por
       * completo. El consumidor de este resultado (UI) debe avisarle a la
       * persona que su selección no viajó, en vez de asumir que sí.
       */
      cartPreserved: boolean;
    }
  | { kind: 'disabled'; message: string }
  | { kind: 'login'; message: string }
  | { kind: 'error'; message: string };

export interface CheckoutGateway {
  readonly mode: CheckoutMode;
  start(items: CartItem[]): Promise<CheckoutResult>;
}

function requestId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  globalThis.crypto?.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return [...bytes]
    .map(
      (byte, index) =>
        `${byte.toString(16).padStart(2, '0')}${[3, 5, 7, 9].includes(index) ? '-' : ''}`,
    )
    .join('');
}

class DisabledCheckout implements CheckoutGateway {
  readonly mode = 'disabled' as const;

  async start() {
    return {
      kind: 'disabled' as const,
      message: 'El checkout está desactivado por ahora. Tu selección quedó guardada.',
    };
  }
}

/**
 * Redirect genérico a la tienda Shopify (`SHOPIFY_STORE_URL`), sin carrito.
 *
 * Este modo (`external_shopify`) es un placeholder deliberadamente simple:
 * `url` es la URL pública de la tienda, no un permalink de carrito, y hoy no
 * existe un mapeo de `CartItem.productId` a variant IDs reales de Shopify
 * (ver `docs/planning/2026-09-22-shopify-checkout-migration.md`, tarea
 * pendiente de Teo). Construir un link de carrito con IDs internos que no
 * son variant IDs de Shopify fallaría silenciosamente o rompería el
 * checkout, así que `start()` ignora `items` a propósito y lo declara vía
 * `cartPreserved: false` en vez de fingir que el carrito viajó.
 *
 * ADVERTENCIA PARA EL MODO `shopify` REAL (`ShopifyCheckout` abajo): este
 * NO es el patrón a copiar. Esa integración va a crear una orden/checkout
 * server-side (Draft Order o Cart API) con los `items` reales y variant IDs
 * verificados, devolviendo `cartPreserved: true`.
 */
class ExternalShopifyCheckout implements CheckoutGateway {
  readonly mode = 'external_shopify' as const;

  constructor(private readonly url: string) {}

  async start() {
    return { kind: 'redirect' as const, url: this.url, provider: this.mode, cartPreserved: false };
  }
}

class MercadoPagoLegacyCheckout implements CheckoutGateway {
  readonly mode = 'mercadopago_legacy' as const;

  async start(items: CartItem[]) {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientRequestId: requestId(), items }),
      });
      const body = (await response.json().catch(() => null)) as {
        checkoutUrl?: unknown;
        message?: unknown;
      } | null;

      if (response.status === 401) {
        return {
          kind: 'login' as const,
          message: 'Inicia sesión con tu cuenta Tueste para continuar con el pago.',
        };
      }
      if (!response.ok || typeof body?.checkoutUrl !== 'string') {
        return {
          kind: 'error' as const,
          message:
            typeof body?.message === 'string'
              ? body.message
              : 'No fue posible iniciar el pago. Inténtalo de nuevo.',
        };
      }

      return {
        kind: 'redirect' as const,
        url: body.checkoutUrl,
        provider: this.mode,
        cartPreserved: true,
      };
    } catch {
      return {
        kind: 'error' as const,
        message: 'No pudimos conectar con el servicio de pagos. Inténtalo de nuevo.',
      };
    }
  }
}

class ShopifyCheckout implements CheckoutGateway {
  readonly mode = 'shopify' as const;

  async start() {
    return {
      kind: 'error' as const,
      message: 'El checkout de Shopify todavía no está habilitado.',
    };
  }
}

export function createCheckoutGateway(config: CheckoutConfig): CheckoutGateway {
  if (config.mode === 'external_shopify' && config.externalShopifyUrl) {
    return new ExternalShopifyCheckout(config.externalShopifyUrl);
  }
  if (config.mode === 'mercadopago_legacy') return new MercadoPagoLegacyCheckout();
  if (config.mode === 'shopify') return new ShopifyCheckout();
  return new DisabledCheckout();
}
