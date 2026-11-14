import { z } from 'zod';
import { getArbol } from './data/cultivo';

/**
 * Puente de compra de Tueste Tree: Experiencia no cobra. El cliente
 * elige aquí su adopción y la paga en la tienda Tueste Co (Shopify) con
 * un enlace de carrito que ya lleva el producto, la cantidad y una
 * referencia para reconocer el pedido cuando la tienda avise del pago.
 *
 * Lógica pura: sin red, sin base de datos y sin variables de entorno.
 */

/** Producto «Adopción Digital · Tueste Tree» en la tienda Tueste Co. */
export const ADOPCION_TIENDA = {
  /** Variante del producto en Shopify. */
  variantId: '51668810006816',
  /** Atributo del carrito donde viaja la referencia de la adopción. */
  refAttribute: 'ref-experiencia',
} as const;

/**
 * Tope técnico de árboles por compra: evita cantidades absurdas en el
 * enlace. No es una regla comercial; la disponibilidad la decide la tienda.
 */
export const MAX_ARBOLES_POR_COMPRA = 999;

/** Longitud máxima del nombre del árbol (igual que el campo del ritual). */
export const MAX_NOMBRE_ARBOL = 40;

/** Base32 de Crockford: sin I, L, O ni U para que no se confundan al leerla. */
const REFERENCE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const REFERENCE_PREFIX = 'TT-';
const REFERENCE_LENGTH = 16;
const REFERENCE_PATTERN = /^TT-[0-9A-HJKMNP-TV-Z]{16}$/;

/**
 * Referencia opaca de una adopción (80 bits de entropía). No contiene
 * datos del cliente: solo sirve para emparejar el pedido de la tienda.
 * La fuente de bytes se inyecta para poder probarla.
 */
export function createAdoptionReference(randomBytes: (size: number) => Uint8Array): string {
  const bytes = randomBytes(10);
  let bits = 0;
  let buffer = 0;
  let body = '';
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      body += REFERENCE_ALPHABET[(buffer >> bits) & 31];
    }
  }
  return `${REFERENCE_PREFIX}${body.slice(0, REFERENCE_LENGTH)}`;
}

export function isAdoptionReference(value: unknown): value is string {
  return typeof value === 'string' && REFERENCE_PATTERN.test(value);
}

/**
 * Enlace de carrito de la tienda con el producto, la cantidad y la
 * referencia. Lanza si la cantidad o la referencia no son válidas: nunca
 * se manda al cliente a pagar con un enlace a medias.
 */
export function buildAdoptionCartUrl(
  storeUrl: string,
  treesCount: number,
  reference: string,
): string {
  if (!Number.isInteger(treesCount) || treesCount < 1 || treesCount > MAX_ARBOLES_POR_COMPRA) {
    throw new Error('Cantidad de árboles inválida para el enlace de compra.');
  }
  if (!isAdoptionReference(reference)) {
    throw new Error('Referencia de adopción inválida para el enlace de compra.');
  }
  const url = new URL(`/cart/${ADOPCION_TIENDA.variantId}:${treesCount}`, storeUrl);
  url.searchParams.set(`attributes[${ADOPCION_TIENDA.refAttribute}]`, reference);
  return url.toString();
}

/** Lo que el cliente envía al pulsar «Ir a pagar». */
export const adoptionRequestSchema = z.object({
  treeId: z
    .string()
    .trim()
    .refine(
      (id) => getArbol(id)?.estado === 'disponible',
      'Elige un árbol disponible del cultivo.',
    ),
  treeName: z
    .string()
    .trim()
    .min(1, 'Ponle nombre a tu árbol.')
    .max(MAX_NOMBRE_ARBOL, `El nombre admite hasta ${MAX_NOMBRE_ARBOL} caracteres.`),
  treesCount: z.coerce
    .number()
    .int('La cantidad debe ser un número entero.')
    .min(1, 'Adopta al menos un árbol.')
    .max(
      MAX_ARBOLES_POR_COMPRA,
      `Puedes adoptar hasta ${MAX_ARBOLES_POR_COMPRA} árboles por compra.`,
    ),
});

export type AdoptionRequest = z.infer<typeof adoptionRequestSchema>;
