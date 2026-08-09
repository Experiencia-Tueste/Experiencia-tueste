/**
 * Utilidades compartidas de la app Tueste — funciones puras,
 * deterministas, sin dependencias de navegador ni efectos laterales,
 * para poder probarlas con Vitest en Node.
 */

/** Formatea un número como moneda colombiana: 185000 -> "COP 185.000". */
export function formatCOP(value: number): string {
  return 'COP ' + Math.round(value).toLocaleString('es-CO');
}

/** Extrae el entero de un texto de precio ("COP 185.000" -> 185000). */
export function priceToInt(raw: string): number {
  return parseInt(String(raw).replace(/[^\d]/g, ''), 10) || 0;
}

/** Formatea segundos como m:ss (222 -> "3:42"). */
export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

/** Normaliza texto para búsqueda libre (quita tildes y pasa a minúsculas). */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Convierte un número de WhatsApp a formato internacional (57 3xx -> 573xx). */
export function toInternationalPhone(raw: string): string | null {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10 && digits[0] === '3') digits = '57' + digits;
  return digits.length >= 11 && digits.length <= 13 ? digits : null;
}

/** Construye la URL de WhatsApp con mensaje pre-cargado. */
export function whatsappLink(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** Conteo de ítems de un carrito (suma de cantidades). */
export function cartCount(items: { qty: number }[]): number {
  return items.reduce((acc, i) => acc + i.qty, 0);
}

/** Total de un carrito en COP. */
export function cartTotal(items: { qty: number; price: number }[]): number {
  return items.reduce((acc, i) => acc + i.qty * i.price, 0);
}
