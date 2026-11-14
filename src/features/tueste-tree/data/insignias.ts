/**
 * Insignias de Tueste Tree y lo que incluye una adopción.
 *
 * Fuente: la ficha del producto «Adopción Digital · Tueste Tree» en la
 * tienda Tueste Co (Shopify), que es donde se compra y se paga. La
 * adopción es una compra anticipada de café más una experiencia: no es
 * una inversión, no genera rendimientos ni participación.
 *
 * El precio NO se repite aquí a propósito: lo define la tienda, y
 * duplicarlo haría que una promoción allá dejara este texto desfasado.
 */

export interface Insignia {
  /** Identificador estable de la insignia. */
  id: 'semilla' | 'plata' | 'oro' | 'holografica';
  /** Orden visual (01…04). */
  orden: string;
  /** Nombre de la insignia, igual que en la tienda. */
  nombre: string;
  /** Rango de árboles en texto. */
  arboles: string;
  /** Mínimo de árboles adoptados en una compra. */
  min: number;
  /** Máximo de árboles; `null` = sin tope. */
  max: number | null;
}

/** Cuatro insignias, según cuántos árboles se adoptan. */
export const INSIGNIAS: readonly Insignia[] = [
  { id: 'semilla', orden: '01', nombre: 'Semilla', arboles: '1 a 9 árboles', min: 1, max: 9 },
  { id: 'plata', orden: '02', nombre: 'Plata', arboles: '10 a 19 árboles', min: 10, max: 19 },
  { id: 'oro', orden: '03', nombre: 'Oro', arboles: '20 a 29 árboles', min: 20, max: 29 },
  {
    id: 'holografica',
    orden: '04',
    nombre: 'Holográfica',
    arboles: '30 árboles o más',
    min: 30,
    max: null,
  },
];

/** Lo que incluye cada adopción (ficha de la tienda). */
export const ADOPCION = {
  bolsasPorArbol: 2,
  gramosPorBolsa: 340,
  certificadoHoras: 48,
  cafeTexto: '2 bolsas de 340 g',
  certificadoTexto: '48 h',
} as const;

export function getInsignia(id: string): Insignia | undefined {
  return INSIGNIAS.find((insignia) => insignia.id === id);
}

/** Insignia que corresponde a una cantidad de árboles (enteros ≥ 1). */
export function insigniaParaCantidad(cantidad: number): Insignia | undefined {
  if (!Number.isInteger(cantidad) || cantidad < 1) return undefined;
  return INSIGNIAS.find(
    (insignia) => cantidad >= insignia.min && (insignia.max === null || cantidad <= insignia.max),
  );
}
