import { LOTES } from '../data/dashboard';
import TuesteTreeEyebrow from './TuesteTreeEyebrow';
import styles from '../tueste-tree.module.css';

/** Lotes presentados como tarjetas de producto, igual al tablero de referencia. */
export default function DashboardLotes() {
  const titles = [
    'Founders',
    'Primera apertura pública',
    'Lotes de temporada',
    'Variedades exóticas',
  ] as const;
  const metadata = [
    '300 árboles · 64 adoptados',
    '1.000 árboles',
    '1.000 por lote',
    '1.840 m · preparación',
  ] as const;

  return (
    <section id="lotes" className={styles.lotesSection} aria-labelledby="lotes-titulo">
      <div className={styles.zoneDivider}>
        <TuesteTreeEyebrow>02 · EL PROYECTO</TuesteTreeEyebrow>
      </div>
      <div className={styles.lotesHeading}>
        <div>
          <TuesteTreeEyebrow>Los lotes</TuesteTreeEyebrow>
          <h2 id="lotes-titulo" className={styles.sectionTitle}>
            La adopción se abre por drops.
          </h2>
        </div>
        <p>
          Cuatro formas de llegar al origen; cada lote tiene su propia frecuencia, historia y café.
        </p>
      </div>
      <ol className={styles.lotesCards}>
        {LOTES.map((lote, index) => (
          <li key={lote.code} className={styles.loteCard}>
            <span className={styles.loteCode}>{index === 3 ? 'LOTE 1840' : `LOTE 00${index}`}</span>
            <span className={styles.loteState}>{lote.meta}</span>
            <h3>{titles[index]}</h3>
            <p>{lote.text}</p>
            <strong>{metadata[index]}</strong>
          </li>
        ))}
      </ol>
    </section>
  );
}
