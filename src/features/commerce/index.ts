/**
 * Feature: commerce
 * ---------------------------------------------------------------------
 * Catálogo y carrito de la experiencia. El checkout se resuelve mediante
 * un gateway configurable; este módulo nunca decide qué proveedor cobrar.
 *
 * Regla del plan: el navegador presenta; el servidor decide. Los
 * precios finales y la validación de cupones viven en rutas de servidor.
 */

export type ProductCategory = 'vinilo' | 'cassette' | 'ceramica' | 'textil' | 'print' | 'cafe';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  categoryLabel: string;
  /** Precio en COP (entero). */
  price: number;
  description: string;
  /** Icono del catálogo (vinyl, cassette, cup, tee, print, coffee). */
  icon: string;
  /**
   * Asset local bajo `public/images/merch/` (p. ej.
   * `/images/merch/vinilo-coffee-in-frequencies.webp`). Vacío = asset
   * pendiente: el componente conserva su fallback editorial SVG.
   */
  imageSrc?: string;
  /** Etiqueta opcional (LIMITADO, NUEVO…). */
  badge?: string;
}

export interface CartItem {
  productId: string;
  qty: number;
  /** Reservado para variantes futuras sin cambiar el contrato del carrito. */
  variantId?: string;
}

export const MAX_CART_QTY = 20;

export interface OrderDraft {
  code: string;
  items: CartItem[];
  channel: 'whatsapp';
  createdAt: string;
}

/** Catálogo de la tienda (datos del mockup). */
export const PRODUCTS: Product[] = [
  {
    id: 'coffee-in-frequencies',
    name: 'Coffee in Frequencies',
    imageSrc: '/images/store/vinilo-coffee-in-frequencies.webp',
    category: 'vinilo',
    categoryLabel: 'Vinilo 12"',
    price: 185000,
    description:
      'Edición limitada numerada. Registro de escucha completo en vinilo translúcido ámbar.',
    icon: 'vinyl',
    badge: 'LIMITADO',
  },
  {
    id: 'field-tapes',
    name: 'Field Tapes · Tostión',
    imageSrc: '/images/store/cassette-field-tapes.webp',
    category: 'cassette',
    categoryLabel: 'Cassette',
    price: 78000,
    description: 'Field recordings de finca en cinta: agua, secado, tostión y máquinas.',
    icon: 'cassette',
  },
  {
    id: 'taza-cantara',
    name: 'Taza Cántara',
    imageSrc: '/images/store/taza-cantara.webp',
    category: 'ceramica',
    categoryLabel: 'Cerámica artesanal',
    price: 95000,
    description: 'Taza de gres hecha a mano. Para escuchar el café mientras lo bebes.',
    icon: 'cup',
  },
  {
    id: 'camiseta-origen',
    name: 'Camiseta Origen',
    imageSrc: '/images/store/camiseta-origen.webp',
    category: 'textil',
    categoryLabel: 'Algodón orgánico',
    price: 119000,
    description: 'Serigrafía del sol Tueste. Tinta a base de agua sobre algodón natural.',
    icon: 'tee',
    badge: 'NUEVO',
  },
  {
    id: 'print-espectrograma',
    name: 'Print Espectrograma',
    imageSrc: '/images/store/print-espectrograma.webp',
    category: 'print',
    categoryLabel: 'Lámina A3',
    price: 64000,
    description: 'El espectrograma de una frecuencia de origen, impreso en papel de algodón.',
    icon: 'print',
  },
  {
    id: 'cafe-lote-000',
    name: 'Café del Lote 000',
    imageSrc: '/images/store/cafe-lote-000.webp',
    category: 'cafe',
    categoryLabel: 'Microlote · 250g',
    price: 72000,
    description: 'El café que suena en las frecuencias. Tueste medio, notas a panela y cítrico.',
    icon: 'coffee',
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

function isValidQty(qty: unknown): qty is number {
  return typeof qty === 'number' && Number.isInteger(qty) && qty > 0;
}

function itemKey(item: Pick<CartItem, 'productId' | 'variantId'>) {
  return `${item.productId}::${item.variantId ?? 'default'}`;
}

/** Recupera un carrito antiguo o dañado sin dejar entrar productos inválidos. */
export function sanitizeCart(input: unknown): CartItem[] {
  if (!Array.isArray(input)) return [];

  const safe = new Map<string, CartItem>();
  for (const value of input) {
    if (typeof value !== 'object' || value === null) continue;
    const item = value as Partial<CartItem>;
    if (
      typeof item.productId !== 'string' ||
      !getProduct(item.productId) ||
      !isValidQty(item.qty) ||
      item.qty > MAX_CART_QTY ||
      (item.variantId !== undefined && typeof item.variantId !== 'string')
    ) {
      continue;
    }

    const normalized = {
      productId: item.productId,
      qty: item.qty,
      ...(item.variantId ? { variantId: item.variantId } : {}),
    } satisfies CartItem;
    const key = itemKey(normalized);
    const current = safe.get(key);
    safe.set(key, {
      ...normalized,
      qty: Math.min(MAX_CART_QTY, (current?.qty ?? 0) + normalized.qty),
    });
  }
  return Array.from(safe.values());
}

/** Añade un producto al carrito (inmutable). */
export function addToCart(items: CartItem[], productId: string, qty = 1): CartItem[] {
  if (!getProduct(productId) || !isValidQty(qty)) return sanitizeCart(items);
  const safeItems = sanitizeCart(items);
  const existing = safeItems.find((i) => i.productId === productId);
  if (existing) {
    return safeItems.map((i) =>
      i.productId === productId ? { ...i, qty: Math.min(MAX_CART_QTY, i.qty + qty) } : i,
    );
  }
  return [...safeItems, { productId, qty: Math.min(MAX_CART_QTY, qty) }];
}

/** Cambia la cantidad (qty <= 0 elimina el ítem). */
export function changeQty(items: CartItem[], productId: string, delta: number): CartItem[] {
  if (!Number.isInteger(delta) || !getProduct(productId)) return sanitizeCart(items);
  return sanitizeCart(items)
    .map((i) =>
      i.productId === productId ? { ...i, qty: Math.min(MAX_CART_QTY, i.qty + delta) } : i,
    )
    .filter((i) => i.qty > 0);
}

/** Número de unidades en el carrito. */
export function cartCount(items: CartItem[]): number {
  return sanitizeCart(items).reduce((acc, i) => acc + i.qty, 0);
}

/** Total del carrito en COP (solo presentación; el servidor valida). */
export function cartTotal(items: CartItem[]): number {
  return sanitizeCart(items).reduce((acc, i) => {
    const p = getProduct(i.productId);
    return acc + (p ? p.price * i.qty : 0);
  }, 0);
}

/** Formatea un monto en COP con separadores locales (es-CO). */
export function formatoCOP(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
}

/** Construye el texto del pedido para WhatsApp (MVP). */
export function buildWhatsappOrderText(draft: OrderDraft): string {
  const lines = draft.items.map((i) => {
    const p = getProduct(i.productId);
    return `- ${i.qty}x ${p?.name ?? i.productId} (${p?.categoryLabel ?? ''}) — COP ${(p?.price ?? 0) * i.qty}`;
  });
  return [
    '*PEDIDO TUESTE — ORIGEN TOSTADO*',
    `Comprobante: ${draft.code}`,
    `Fecha: ${draft.createdAt}`,
    '',
    ...lines,
    '',
    `*TOTAL: ${cartTotal(draft.items)}*`,
    '',
    'Hola 🌞 Quiero confirmar este pedido y coordinar el pago seguro por aquí.',
  ].join('\n');
}
