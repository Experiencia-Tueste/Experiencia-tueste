import { loadMapTilerPublicConfig } from '../../lib/config/env-public';
import type { StyleSpecification } from 'maplibre-gl';

/** Configuración central del mapa de origen. */

const MAPTILER_RASTER_TILES_URL = 'https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png';

/**
 * Construye un estilo ráster mínimo con los tiles oficiales de MapTiler.
 * Evitar el estilo vectorial remoto reduce las peticiones adicionales de
 * fuentes y sprites para esta demo, manteniendo pan/zoom de MapLibre.
 * Sin una clave pública configurada no se carga MapLibre: el fallback
 * accesible permanece visible en lugar de mostrar un canvas vacío.
 */
export function getMapStyle(): StyleSpecification | null {
  const config = loadMapTilerPublicConfig();

  if (!config) return null;

  return {
    version: 8,
    sources: {
      maptiler: {
        type: 'raster',
        tiles: [`${MAPTILER_RASTER_TILES_URL}?key=${encodeURIComponent(config.mapTilerKey)}`],
        tileSize: 512,
        attribution: '© MapTiler © OpenStreetMap contributors',
      },
    },
    layers: [{ id: 'maptiler-streets', type: 'raster', source: 'maptiler' }],
  };
}

/** Zoom inicial y límites (sin rotación 3D ni pitch). */
export const MAP_INITIAL_ZOOM = 11;
export const MAP_MIN_ZOOM = 4;
export const MAP_MAX_ZOOM = 15;
