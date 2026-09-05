'use client';

import { ARBOLES_GROVE } from '../data/cultivo';
import styles from '../tueste-tree.module.css';

export interface TreeGroveProps {
  /** Árbol seleccionado temporalmente (memoria del ritual). */
  seleccionadoId: string | null;
  /** Selecciona o deselecciona un árbol. */
  onSelect: (id: string) => void;
}

/**
 * Cuadrícula del lote (ritual de adopción): 300 árboles deterministas
 * dispuestos como cafetal (25 columnas en escritorio). Cada árbol
 * disponible es un botón con aria-pressed; los adoptados no son
 * interactivos. Sin aleatoriedad, sin persistencia.
 */
export default function TreeGrove({ seleccionadoId, onSelect }: TreeGroveProps) {
  return (
    <ul className={styles.grove} aria-label="Árboles del Lote 000 Founders">
      {ARBOLES_GROVE.map((arbol) => {
        const esAdoptado = arbol.estado === 'adoptado';
        const esSeleccionado = seleccionadoId === arbol.id;
        const etiqueta = esAdoptado
          ? `Árbol ${arbol.numero} del Lote 000 · adoptado`
          : esSeleccionado
            ? `Árbol ${arbol.numero} seleccionado · pulsar para deseleccionar`
            : `Seleccionar árbol ${arbol.numero} del Lote 000`;

        return (
          <li key={arbol.id} className={styles.groveItem}>
            <button
              type="button"
              className={`${styles.groveTree}${
                esSeleccionado ? ` ${styles.groveTreeSelected}` : ''
              }${esAdoptado ? ` ${styles.groveTreeAdopted}` : ''}`}
              aria-pressed={esSeleccionado}
              aria-label={etiqueta}
              disabled={esAdoptado}
              onClick={() => onSelect(esSeleccionado ? '' : arbol.id)}
            >
              <span className={styles.groveNum} aria-hidden="true">
                {arbol.numero}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
