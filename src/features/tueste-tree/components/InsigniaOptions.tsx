'use client';

import { INSIGNIAS } from '../data/insignias';
import styles from '../tueste-tree.module.css';

export interface InsigniaOptionsProps {
  /** Insignia que corresponde a la cantidad elegida. */
  insigniaId: string | null;
  /** Avisa qué insignia se pulsó (el ritual ajusta la cantidad a su mínimo). */
  onSelect: (id: string) => void;
}

/**
 * Las cuatro insignias de la adopción: orden, nombre y rango de árboles.
 * La insignia depende de la cantidad: pulsar una lleva la cantidad a su
 * mínimo. Sin navegación ni pago aquí; la compra se hace en la tienda.
 */
export default function InsigniaOptions({ insigniaId, onSelect }: InsigniaOptionsProps) {
  return (
    <ul className={styles.levels}>
      {INSIGNIAS.map((insignia) => {
        const esSeleccionada = insigniaId === insignia.id;
        return (
          <li key={insignia.id} className={styles.levelItem}>
            <button
              type="button"
              className={`${styles.levelCard}${esSeleccionada ? ` ${styles.levelCardSelected}` : ''}`}
              aria-pressed={esSeleccionada}
              aria-label={`Insignia ${insignia.nombre}: ${insignia.arboles}`}
              onClick={() => onSelect(insignia.id)}
              data-commercial-intent={`tree-insignia-${insignia.id}`}
            >
              <span className={styles.levelNum} aria-hidden="true">
                {insignia.orden}
              </span>
              <strong className={styles.levelName}>{insignia.nombre}</strong>
              <span className={styles.levelRange}>{insignia.arboles}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
