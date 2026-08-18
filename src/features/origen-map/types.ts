/**
 * Tipos del mapa de origen (contrato de datos).
 *
 * Regla de privacidad: ningún punto se marca como «exacto»,
 * «confirmado» ni «ubicación real». Solo existen dos niveles:
 * `aproximada` (referencia editorial) e `ilustrativa` (demostración).
 */

export type MapPrecision = 'aproximada' | 'ilustrativa';
export type MapStatus = 'publicado' | 'proximamente';
export type MapTipo = 'finca' | 'guardian';

export interface OrigenMapPunto {
  /** Identificador estable. */
  id: string;
  /** Nombre editorial visible. */
  nombre: string;
  tipo: MapTipo;
  estado: MapStatus;
  precision: MapPrecision;
  /** Descripción corta visible en el fallback textual. */
  descripcion: string;
  /** GeoJSON siempre [longitud, latitud]. Provisional y no exacta. */
  lngLat: [number, number];
  /** Color del marcador (hex de la paleta Tueste). */
  color: string;
}
