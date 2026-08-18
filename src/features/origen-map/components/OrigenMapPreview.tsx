'use client';

import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Map as MlMap } from 'maplibre-gl';
import { MAP_INITIAL_ZOOM, MAP_MAX_ZOOM, MAP_MIN_ZOOM, TILE_STYLE_URL } from '../config';
import type { OrigenMapPunto } from '../types';
import OrigenMapFallback from './OrigenMapFallback';
import styles from './OrigenMapPreview.module.css';

export interface OrigenMapPreviewProps {
  punto: OrigenMapPunto;
  /** Etiqueta editorial visible sobre el mapa (p. ej. «Ubicación aproximada · demostración»). */
  etiqueta: string;
  className?: string;
}

/**
 * Comprueba de forma segura si el navegador dispone de WebGL2, ANTES de
 * importar MapLibre. Sin WebGL2 no se importa la librería, no se
 * imprimen errores de GPU y el fallback textual permanece visible.
 */
function hasWebGL2(): boolean {
  if (typeof WebGL2RenderingContext === 'undefined') {
    return false;
  }

  try {
    const probe = document.createElement('canvas');
    return !!probe.getContext('webgl2');
  } catch {
    return false;
  }
}

/**
 * Mini-mapa interactivo de territorio (MapLibre GL JS).
 *
 * - El JS de MapLibre se carga dinámicamente DENTRO de useEffect: no
 *   hay SSR ni WebGL en el servidor (sin hydration mismatch).
 * - El fallback textual se muestra inicialmente y permanece visible
 *   hasta que el mapa emite `load`; solo entonces se muestra el canvas
 *   y la etiqueta editorial, y el fallback se oculta visualmente.
 * - Un error ANTES de `load` mantiene el fallback y limpia el mapa. Un
 *   error aislado de tiles DESPUÉS de `load` no destruye el mapa
 *   (comportamiento nativo de MapLibre: el mapa sigue siendo usable).
 * - Compatible con React Strict Mode: creación única por mount y
 *   cleanup con `map.remove()`.
 * - Pitch/rotación 3D desactivados; pan, zoom y controles de zoom
 *   activos. Con prefers-reduced-motion no hay animaciones de cámara.
 * - El contenedor del mapa es una región accesible con etiqueta; sin
 *   controles enfocables dentro de ancestros aria-hidden.
 * - La atribución de MapLibre/OpenFreeMap/OpenMapTiles/OSM se mantiene
 *   visible (por defecto, nunca se oculta).
 * - Sin Math.random, fechas dinámicas ni datos de red propios.
 */
export default function OrigenMapPreview({ punto, etiqueta, className }: OrigenMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    let cancelled = false;
    let map: MlMap | null = null;
    let didLoad = false;

    const removeMap = () => {
      if (!map) return;

      map.remove();

      if (mapRef.current === map) {
        mapRef.current = null;
      }

      map = null;
    };

    setMapReady(false);
    setFailed(false);

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    void (async () => {
      // Sin WebGL2: fallback para siempre, sin importar MapLibre.
      // (La verificación vive dentro del flujo asíncrono para no
      // disparar setState síncrono en el cuerpo del effect.)
      if (!hasWebGL2()) {
        if (!cancelled) setFailed(true);
        return;
      }

      try {
        const ml = await import('maplibre-gl');
        if (cancelled || !containerRef.current) return;

        map = new ml.Map({
          container,
          style: TILE_STYLE_URL,
          center: punto.lngLat,
          zoom: MAP_INITIAL_ZOOM,
          minZoom: MAP_MIN_ZOOM,
          maxZoom: MAP_MAX_ZOOM,
          // Sin rotación 3D ni pitch: mapa plano editorial.
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          // Sin animaciones de cámara con reduced motion.
          fadeDuration: reduceMotion ? 0 : 300,
          // La atribución permanece visible por defecto (requisito de
          // los datos de OpenFreeMap/OpenMapTiles/OSM): no se oculta.
        });

        mapRef.current = map;

        map.on('load', () => {
          didLoad = true;

          if (!cancelled) {
            setFailed(false);
            setMapReady(true);
          }
        });

        map.on('error', () => {
          // Antes de load no hay mapa usable: se conserva el fallback
          // y se limpia exclusivamente esta instancia. Tras load los
          // errores de tile son recuperables y no se destruye el mapa.
          if (didLoad) return;

          if (!cancelled) {
            setMapReady(false);
            setFailed(true);
          }

          removeMap();
        });

        map.addControl(
          new ml.NavigationControl({ showCompass: false, showZoom: true }),
          'bottom-right',
        );

        new ml.Marker({ color: punto.color }).setLngLat(punto.lngLat).addTo(map);
      } catch {
        // Error antes de load: sin canvas usable; se conserva el
        // fallback y se limpia cualquier mapa a medio crear.
        if (!cancelled) {
          setMapReady(false);
          setFailed(true);
        }

        removeMap();
      }
    })();

    return () => {
      cancelled = true;
      removeMap();
    };
  }, [punto]);

  const fallbackOculto = mapReady && !failed;

  return (
    <div className={`${styles.wrap}${className ? ` ${className}` : ''}`} data-origen-map-preview>
      <OrigenMapFallback punto={punto} oculto={fallbackOculto} />
      {/* Región accesible del mapa: sin aria-hidden y con etiqueta. */}
      <div
        ref={containerRef}
        className={styles.map}
        data-origen-map-container
        role="region"
        aria-label={`Mapa interactivo provisional: ${punto.nombre}. Ubicación ${punto.precision}.`}
        aria-busy={!mapReady && !failed}
      />
      {fallbackOculto && <span className={styles.etiqueta}>{etiqueta}</span>}
    </div>
  );
}
