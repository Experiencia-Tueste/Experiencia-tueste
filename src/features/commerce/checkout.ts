/**
 * Contrato del canal comercial de la sección Tienda.
 *
 * Experiencia no tiene carrito ni cobra desde el navegador: la compra vive
 * en la tienda Tueste Co (Shopify). Aquí solo queda el modo configurado en
 * servidor (`CHECKOUT_MODE`) y la URL pública de la tienda.
 *
 * - `disabled`: sin enlace de compra.
 * - `external_shopify`: la sección Tienda enlaza a `SHOPIFY_STORE_URL`.
 * - `mercadopago_legacy`: habilita la ruta de servidor `/api/checkout` (BFF
 *   antiguo); ya no tiene interfaz que la invoque.
 * - `shopify`: reservado para una integración nativa futura.
 */
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
