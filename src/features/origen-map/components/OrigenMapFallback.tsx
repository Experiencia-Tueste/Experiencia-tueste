import type { OrigenMapPunto } from '../types';
import styles from './OrigenMapFallback.module.css';

export interface OrigenMapFallbackProps {
  punto: OrigenMapPunto;
  className?: string;
  /**
   * Oculta visualmente el fallback (y lo marca aria-hidden) cuando el
   * mapa ya cargó; el contenido sigue en el DOM para el caso de error.
   */
  oculto?: boolean;
  /**
   * Muestra la descripción del punto (por defecto, true). La ruta
   * /adopta la desactiva porque su composición editorial no debe
   * mostrar coordenadas en pantalla. Aditivo: /experiencia no cambia.
   */
  mostrarDescripcion?: boolean;
}

/**
 * Fallback textual del mapa: se renderiza en el servidor (SSR) y queda
 * visible sin JavaScript, sin WebGL o si MapLibre falla. Muestra
 * nombre, estado y precisión del punto.
 */
export default function OrigenMapFallback({
  punto,
  className,
  oculto = false,
  mostrarDescripcion = true,
}: OrigenMapFallbackProps) {
  const estadoLabel = punto.estado === 'proximamente' ? 'próximamente' : 'publicado';
  const precisionLabel =
    punto.precision === 'aproximada' ? 'Ubicación aproximada' : 'Punto editorial';

  return (
    <div
      className={`${styles.fallback}${oculto ? ` ${styles.oculto}` : ''}${
        className ? ` ${className}` : ''
      }`}
      data-origen-map-fallback
      aria-hidden={oculto || undefined}
    >
      <span className={styles.nombre}>{punto.nombre}</span>
      <span className={styles.meta}>
        {precisionLabel} · {estadoLabel}
      </span>
      {mostrarDescripcion && <span className={styles.desc}>{punto.descripcion}</span>}
    </div>
  );
}
