import Image from 'next/image';
import { BONDS } from '../data/adoption-content';
import styles from './AdoptionBondGrid.module.css';

/**
 * Tres vínculos editoriales (Semilla, Árbol joven, Árbol guardián).
 *
 * Piezas fotográficas de lectura: sin precios, sin compra, sin botones
 * y sin foco artificial. Cada tarjeta: fotografía local con `next/image`,
 * índice editorial mono, nombre serif y texto, con borde fino y overlay
 * degradado para legibilidad en ambos temas.
 *
 * Accesibilidad: las fotografías son contenido (alt descriptivo, no
 * decorativo); el hover sutil solo aparece en dispositivos que lo
 * soportan y no sugiere interacción.
 */
export default function AdoptionBondGrid() {
  return (
    <ul className={styles.grid}>
      {BONDS.map((bond) => (
        <li key={bond.id} className={styles.bond}>
          <div className={styles.visual}>
            <Image
              src={bond.imageSrc}
              alt={bond.imageAlt}
              fill
              sizes="(max-width: 780px) 100vw, 33vw"
              className={styles.image}
            />
            <span className={styles.overlay} aria-hidden="true" />
          </div>
          <div className={styles.body}>
            <span className={styles.index} aria-hidden="true">
              {bond.index}
            </span>
            <h3 className={styles.name}>{bond.name}</h3>
            <p className={styles.text}>{bond.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
