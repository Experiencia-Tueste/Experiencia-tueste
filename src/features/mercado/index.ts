/**
 * Feature: mercado
 * ---------------------------------------------------------------------
 * Mercado de Origen (09): catálogo editorial de marcas de café colombiano
 * y pasos del modelo de venta directa. Las acciones públicas registran
 * solicitudes para revisión; no crean compras ni publicaciones visibles.
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

/** Aviso visible de la sección. */
export const AVISO_MERCADO =
  'Las solicitudes se revisan antes de publicar una marca o confirmar una venta.';

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
      'Tueste revisa la solicitud y, una vez aprobada, tu producto aparece con marca, origen, precio y número de ventas.',
  },
  {
    num: '3',
    titulo: 'Vende directo',
    texto:
      'El cliente puede solicitar disponibilidad. El pago y el envío se acuerdan después entre vendedor y cliente, sin comisiones de Tueste.',
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

/** Mensaje de consulta comercial de una tarjeta del catálogo. */
export function consultaMensaje(item: MercadoItem): string {
  return `Solicitud de disponibilidad para «${item.marca} · ${item.tipo}» (${item.origen}) recibida. El equipo confirmará el siguiente paso.`;
}

/** Mensaje de solicitud de publicación, sin prometer que el catálogo ya cambió. */
export function publicacionMensaje(preview: PublicacionPreview, precioTexto: string): string {
  return `Solicitud de publicación para «${preview.marca}» (${preview.tipo} · ${preview.origen} · ${precioTexto}) recibida. El equipo la revisará antes de mostrarla en el mercado.`;
}
