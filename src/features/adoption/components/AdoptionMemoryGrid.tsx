import Image from 'next/image';
import { MEMORIES } from '../data/adoption-content';
import styles from './AdoptionMemoryGrid.module.css';

/**
 * Galería editorial «Memorias para volver al origen».
 *
 * Cuatro tarjetas fotográficas de propuesta editorial: sin promesas de
 * entrega física, sin precios y sin botones. Cada tarjeta: fotografía
 * local con `next/image`, índice ámbar, título crema y descripción,
 * con overlay oscuro degradado y altura consistente.
 *
 * Accesibilidad: las fotografías son contenido (alt descriptivo). El
 * hover es muy sutil y no sugiere interacción.
 */
export default function AdoptionMemoryGrid() {
  return (
    <ul className={styles.grid}>
      {MEMORIES.map((memory) => (
        <li key={memory.id} className={styles.card}>
          <Image
            src={memory.imageSrc}
            alt={memory.imageAlt}
            fill
            sizes="(max-width: 780px) 100vw, 50vw"
            className={styles.image}
          />
          <span className={styles.overlay} aria-hidden="true" />
          <div className={styles.body}>
            <span className={styles.index}>{memory.index}</span>
            <h3 className={styles.name}>{memory.name}</h3>
            <p className={styles.description}>{memory.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
