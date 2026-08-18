/**
 * Configuración central del mapa de origen.
 */

/**
 * Estilo de tiles PROVISIONAL para la demo (OpenFreeMap, oscuro).
 * Sin SLA y sin garantías de producción: se sustituirá antes del
 * lanzamiento por Amazon Location Service o MapTiler. No se usa ningún
 * token ni variable de entorno.
 */
export const TILE_STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';

/** Zoom inicial y límites (sin rotación 3D ni pitch). */
export const MAP_INITIAL_ZOOM = 11;
export const MAP_MIN_ZOOM = 4;
export const MAP_MAX_ZOOM = 15;
