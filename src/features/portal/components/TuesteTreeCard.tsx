import Image from 'next/image';
import Link from 'next/link';
import styles from './TuesteTreeCard.module.css';

/**
 * Tarjeta de entrada a Tueste Tree dentro del portal principal.
 *
 * Usa una fotografía local del cafetal del Lote 000 para conectar el
 * portal con la interfaz de adopción sin depender de medios externos.
 */
export default function TuesteTreeCard() {
  return (
    <Link href="/tueste-tree" className={styles.card}>
      <span className={styles.medallion} aria-hidden="true">
        <span className={styles.ring} />
        <span className={styles.seed} />
      </span>
      <div className={styles.visual} aria-hidden="true">
        <Image
          src="/images/tueste-tree/lote-000-cafetal-v1.png"
          alt=""
          width={1122}
          height={1402}
          className={styles.art}
          sizes="(max-width: 780px) 100vw, 380px"
        />
        <span className={styles.overlay} />
        <span className={styles.label}>Lote 000 · Founders</span>
      </div>
      <h2 className={styles.title}>Tueste Tree</h2>
      <p className={styles.desc}>Adopta un árbol y acompaña el origen desde la finca.</p>
      <span className={styles.cta}>
        Conocer Tueste Tree
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      </span>
    </Link>
  );
}
