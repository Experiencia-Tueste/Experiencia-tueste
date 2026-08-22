import type { StyleSpecification } from 'maplibre-gl';
import { loadMapTilerPublicConfig } from '../../lib/config/env-public';

/**
 * Configuración central del mapa de origen.
 * ---------------------------------------------------------------------
 * MapTiler como proveedor de tiles (clave pública restringida por
 * dominio en su panel). El estilo es RÁSTER mínimo (streets-v4): calles,
 * relieve y etiquetas sin las peticiones adicionales de fuentes/sprites
 * del estilo vectorial remoto, manteniendo pan/zoom de MapLibre.
 *
 * Sin una clave pública configurada NO se construye un estilo: el
 * fallback accesible permanece visible en lugar de un canvas vacío.
 */

const MAPTILER_RASTER_TILES_URL = 'https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png';

/**
 * Construye el estilo ráster con los tiles oficiales de MapTiler.
 *
 * @returns El objeto de estilo, o `null` cuando la clave pública no
 *   está configurada (modo demo: sin mapa defectuoso, fallback visible).
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
