import styles from './Registros.module.css';

/**
 * Tarjetas complementarias de la sección: Registro de escucha y Registro
 * de pista, replicando los bloques del mockup.
 */
export default function Registros() {
  return (
    <div className={styles.grid}>
      <article className={`${styles.reg} ${styles.escucha}`}>
        <h3>Registro de escucha</h3>
        <div className={styles.sub}>Ambient · Paisaje sonoro cafetero</div>
        <p>
          Para la escucha profunda, las catas y las frecuencias contemplativas. Subgraves suaves,
          agua, viento y texturas de campo. El sonido de la finca en reposo.
        </p>
      </article>
      <article className={`${styles.reg} ${styles.pista}`}>
        <h3>Registro de pista</h3>
        <div className={styles.sub}>Organic House · Afro-organic</div>
        <p>
          Para energía, trance, ritual y conexión corporal. Es el sonido que sostiene los eventos:
          groove orgánico construido sobre la percusión y los sonidos del origen.
        </p>
      </article>
    </div>
  );
}
