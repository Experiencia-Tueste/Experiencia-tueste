/**
 * Feature: mercado
 * ---------------------------------------------------------------------
 * Mercado de Origen (09): catálogo demo de marcas de café colombiano y
 * pasos del modelo de venta directa. SIN operación real todavía: los CTA
 * de compra solo anuncian que la consulta comercial se habilitará cuando
 * el cliente confirme el flujo (sin WhatsApp, pagos, auth ni APIs).
 *
 * El catálogo de Mercado es independiente del carrito de Tienda
 * (features/commerce): aquí no hay carrito, solo presentación.
 */

export type MercadoTipo =
  'Café tostado' | 'Café molido' | 'Café en verde' | 'Cápsulas' | 'Métodos & accesorios';

/** Acentos de marca por tipo de producto (CSS variable --mc). */
export type MercadoAccent = 'amber' | 'coral' | 'teal' | 'purple';

export interface MercadoItem {
  /** Marca o finca vendedora. */
  marca: string;
  tipo: MercadoTipo;
  /** Región de origen en Colombia. */
  origen: string;
  /** Precio en COP (entero). */
  precio: number;
  descripcion: string;
  /**
   * Asset local bajo `public/images/mercado/` (p. ej.
   * `/images/mercado/finca-la-aurora.webp`). Vacío = asset pendiente:
   * el componente conserva su fallback editorial SVG.
   */
  imageSrc?: string;
  /** Los ítems del catálogo son demostrativos (vendedor de ejemplo). */
  demo: boolean;
}

export interface MercadoPaso {
  num: string;
  titulo: string;
  texto: string;
}

/** Vista previa local del formulario «Publica tu producto» (solo memoria). */
export interface PublicacionPreview {
  marca: string;
  tipo: MercadoTipo;
  origen: string;
  precio: number;
  descripcion: string;
}

/** Aviso visible de la sección (sin prometer operación activa). */
export const AVISO_MERCADO =
  'Las publicaciones y la operación comercial se habilitarán cuando el cliente confirme el flujo.';

/** Tipos disponibles en el formulario de publicación (orden del mockup). */
export const MERCADO_TIPOS: MercadoTipo[] = [
  'Café tostado',
  'Café molido',
  'Café en verde',
  'Cápsulas',
  'Métodos & accesorios',
];

/** Color de acento por tipo (del mockup MK_COL). */
export const MERCADO_ACCENT: Record<MercadoTipo, MercadoAccent> = {
  'Café tostado': 'amber',
  'Café molido': 'coral',
  'Café en verde': 'teal',
  Cápsulas: 'purple',
  'Métodos & accesorios': 'purple',
};

/** Pasos «cómo funcionará» (modo demo: nada está activo todavía). */
export const MERCADO_PASOS: MercadoPaso[] = [
  {
    num: '1',
    titulo: 'Regístrate',
    texto:
      'Con la suscripción de USD 10/mes por marca podrás publicar. Solo café y productos relacionados; la curaduría la hace Tueste.',
  },
  {
    num: '2',
    titulo: 'Publica',
    texto:
      'Cuando la publicación se habilite, tu producto aparecerá en el mercado con tu marca, origen, precio y tu número de ventas.',
  },
  {
    num: '3',
    titulo: 'Vende directo',
    texto:
      'El botón de compra abrirá la consulta directa con el vendedor. El pago y el envío se acordarán entre tú y tu cliente, sin comisiones de Tueste.',
  },
];

/** Catálogo demo del mercado (datos del mockup). */
export const MERCADO_ITEMS: MercadoItem[] = [
  {
    marca: 'Finca La Aurora',
    imageSrc: '/images/mercado/finca-la-aurora.webp',
    tipo: 'Café tostado',
    origen: 'Huila',
    precio: 42000,
    descripcion: 'Caturra lavado · notas de panela y cítricos · 340 g',
    demo: true,
  },
  {
    marca: 'Verde Andino',
    imageSrc: '/images/mercado/verde-andino.webp',
    tipo: 'Café en verde',
    origen: 'Nariño',
    precio: 980000,
    descripcion: 'Lote de 70 kg · Castillo · para tostadores',
    demo: true,
  },
  {
    marca: 'Molino Cauca',
    imageSrc: '/images/mercado/molino-cauca.webp',
    tipo: 'Métodos & accesorios',
    origen: 'Cauca',
    precio: 155000,
    descripcion: 'Molino manual de fresas cerámicas',
    demo: true,
  },
];

/** Valida que un tipo del formulario pertenezca al catálogo. */
export function esTipoValido(tipo: string): tipo is MercadoTipo {
  return (MERCADO_TIPOS as string[]).includes(tipo);
}

/**
 * Parsea un precio escrito por el usuario («48.000», «48000»…) a entero.
 * Devuelve null si no hay dígitos o el valor no es un número positivo.
 */
export function parsearPrecio(texto: string): number | null {
  const limpio = texto.replace(/[^\d]/g, '');
  if (!limpio) return null;
  const n = Number(limpio);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Mensaje aria-live del CTA «Comprar» de una tarjeta demo. */
export function consultaMensaje(item: MercadoItem): string {
  return `Consulta comercial por «${item.marca} · ${item.tipo}» (${item.origen}): se habilitará cuando el cliente confirme el flujo.`;
}

/** Mensaje aria-live al crear la vista previa local (no se publica nada). */
export function publicacionMensaje(preview: PublicacionPreview, precioTexto: string): string {
  return `Vista previa local creada para «${preview.marca}» (${preview.tipo} · ${preview.origen} · ${precioTexto}). No se envió ni se guardó: las publicaciones se habilitarán cuando el cliente confirme el flujo.`;
}
