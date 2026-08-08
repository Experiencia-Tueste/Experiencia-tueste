import type { TrackId } from '@/lib/audio';
import BaristaChat from './BaristaChat';
import styles from './BaristaSonoro.module.css';

export interface BaristaSonoroProps {
  /** Selecciona la pista recomendada en el reproductor (estado compartido). */
  onSelect: (id: TrackId) => void;
}

/**
 * Sección «04 / BARISTA SONORO» · el barista te lee el momento.
 * El chat vive en BaristaChat; aquí se conserva la jerarquía editorial y
 * el aviso de que la propuesta no es una afirmación médica.
 */
export default function BaristaSonoro({ onSelect }: BaristaSonoroProps) {
  return (
    <section id="recetario" className={styles.section} aria-labelledby="barista-titulo">
      <div className={styles.sechead}>
        <span className={styles.secnum}>04 / BARISTA SONORO</span>
      </div>
      <h2 id="barista-titulo" className={styles.title}>
        Deja que el café te <em>recomiende</em>
      </h2>
      <p className={styles.lead}>
        Responde unas preguntas y el barista sonoro de Origen Tostado leerá tu momento para
        recomendarte un maridaje: una bebida de café, una frecuencia y una playlist que conversan
        entre sí. No es medicina: es una exploración sensorial entre sabor, sonido y territorio.
      </p>

      <BaristaChat onSelect={onSelect} />
    </section>
  );
}
