'use client';

import { NIVELES_FUNDACIONALES } from '../data/niveles';
import styles from '../tueste-tree.module.css';

export interface CofoundingLevelsProps {
  /** Nivel seleccionado temporalmente. */
  nivelId: string | null;
  /** Selecciona un nivel. */
  onSelect: (id: string) => void;
}

/**
 * Las seis tarjetas de cofundación de José: número, título, rango,
 * porcentaje/cifra de referencia y descripción. Selección local, sin
 * navegación externa ni pago. Las cifras son informativas y sujetas a
 * estructuración legal (visible en el aviso).
 */
export default function CofoundingLevels({ nivelId, onSelect }: CofoundingLevelsProps) {
  return (
    <ul className={styles.levels}>
      {NIVELES_FUNDACIONALES.map((nivel) => {
        const esSeleccionado = nivelId === nivel.id;
        return (
          <li key={nivel.id} className={styles.levelItem}>
            <button
              type="button"
              className={`${styles.levelCard}${esSeleccionado ? ` ${styles.levelCardSelected}` : ''}`}
              aria-pressed={esSeleccionado}
              aria-label={`Nivel de cofundación ${nivel.nivel}: ${nivel.nombre} · ${nivel.arboles} · ${nivel.usd}`}
              onClick={() => onSelect(esSeleccionado ? '' : nivel.id)}
              data-commercial-intent={`tree-level-${nivel.id}`}
            >
              <span className={styles.levelNum} aria-hidden="true">
                {nivel.nivel}
              </span>
              <strong className={styles.levelName}>{nivel.nombre}</strong>
              <span className={styles.levelRange}>{nivel.arboles}</span>
              <span className={styles.levelEquity}>{nivel.equity}</span>
              <span className={styles.levelUsd}>{nivel.usd}</span>
              <span className={styles.levelNote}>{nivel.nota}</span>
              <span className={styles.levelDesc}>{nivel.descripcion}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
