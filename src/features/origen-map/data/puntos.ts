import type { OrigenMapPunto } from '../types';

/**
 * Datos locales del mapa de origen — deterministas y explícitamente
 * provisionales. Ningún punto es una ubicación exacta ni confirmada.
 */
export const PUNTOS_MAPA: readonly OrigenMapPunto[] = [
  {
    id: 'finca-tres-esquinas',
    nombre: 'Finca Tres Esquinas',
    tipo: 'finca',
    estado: 'publicado',
    precision: 'aproximada',
    descripcion:
      'Aproximación editorial basada en 4°32′ N · 75°40′ O. No representa una localización exacta.',
    // GeoJSON siempre usa [longitud, latitud].
    lngLat: [-75.6667, 4.5333],
    color: '#fba922',
  },
  {
    id: 'guardianes-origen',
    nombre: 'Los guardianes del origen',
    tipo: 'guardian',
    estado: 'proximamente',
    precision: 'ilustrativa',
    descripcion:
      'Punto editorial de demostración. No representa una ubicación física de los guardianes.',
    lngLat: [-75.6467, 4.5533],
    color: '#19c9b8',
  },
];

export function getPuntoMapa(id: string): OrigenMapPunto | undefined {
  return PUNTOS_MAPA.find((p) => p.id === id);
}
