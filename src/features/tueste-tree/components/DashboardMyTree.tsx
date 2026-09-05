import Image from 'next/image';
import Link from 'next/link';
import { MI_ARBOL_DEMO } from '../data/dashboard';
import TuesteTreeEyebrow from './TuesteTreeEyebrow';
import styles from '../tueste-tree.module.css';

const CYCLE = [
  ['Germinación', 'La raíz busca la tierra.', 'Ahora'],
  ['Floración', 'La montaña abre el aire.', 'Temporada'],
  ['Cereza', 'El fruto encuentra su color.', 'Cosecha'],
  ['Cosecha', 'Manos que conocen el lote.', 'Recolección'],
  ['Tu taza', 'El origen vuelve a sonar.', 'Después'],
] as const;

/** Núcleo visual del tablero: vínculo, ciclo y frecuencia del lote. */
export default function DashboardMyTree() {
  return (
    <section id="mi-arbol" className={styles.adoptionZone} aria-labelledby="mi-arbol-titulo">
      <div className={styles.zoneDivider}>
        <TuesteTreeEyebrow>01 · TU ADOPCIÓN</TuesteTreeEyebrow>
      </div>
      <div className={styles.adoptionGrid}>
        <article className={styles.myTree}>
          <div className={styles.myTreeTerrain} aria-hidden="true" />
          <div className={styles.myTreeBody}>
            <TuesteTreeEyebrow>Tu árbol adoptado</TuesteTreeEyebrow>
            <h2 id="mi-arbol-titulo" className={styles.sectionTitle}>
              Todo empieza eligiendo un árbol.
            </h2>
            <p className={styles.dropLead}>
              Cuando elijas tu árbol, aquí verás su número, su lote y el ciclo que acompaña. Por
              ahora, el primer paso es elegir el punto del cultivo que vas a acompañar.
            </p>
            <Link href="/tueste-tree/adoptar" className={styles.ctaPrimary}>
              Elegir mi árbol <span aria-hidden="true">↓</span>
            </Link>
          </div>
          <div className={styles.treeCycle}>
            <div className={styles.cycleSun} aria-hidden="true">
              <span />
            </div>
            <div className={styles.cycleList}>
              <span className={styles.cycleLabel}>Ciclo del árbol</span>
              {CYCLE.map(([name, phrase, when], index) => (
                <div className={styles.cycleRow} key={name}>
                  <span className={styles.cycleDot} aria-hidden="true">
                    {index + 1}
                  </span>
                  <span>
                    <strong>{name}</strong>
                    <small>{phrase}</small>
                  </span>
                  <em>{when}</em>
                </div>
              ))}
            </div>
          </div>
        </article>

        <aside className={styles.participationStack} aria-label="Participación editorial">
          <article className={styles.participationCard}>
            <TuesteTreeEyebrow>Tu participación</TuesteTreeEyebrow>
            <div className={styles.participationMetrics}>
              <div>
                <strong>1</strong>
                <span>Árboles</span>
              </div>
              <div>
                <strong>0,003%</strong>
                <span>Equity</span>
              </div>
              <div>
                <strong>USD 100</strong>
                <span>Aporte</span>
              </div>
              <div>
                <strong>01</strong>
                <span>Nivel</span>
              </div>
            </div>
            <div className={styles.levelProgress}>
              <span>Nivel 01 · Entrada simbólica</span>
              <span>Siguiente nivel</span>
              <i>
                <b />
              </i>
            </div>
            <input
              className={styles.participationControl}
              type="range"
              min="1"
              max="6"
              defaultValue="1"
              aria-label="Simulación editorial del nivel de participación"
            />
            <p className={styles.participationNote}>
              Mueve el control para explorar los niveles. Cifras indicativas y sujetas a
              estructuración legal.
            </p>
          </article>
          <article className={styles.frequencyCard}>
            <Image
              src="/images/tueste-tree/sol-crema.png"
              alt=""
              width={190}
              height={190}
              className={styles.frequencySun}
            />
            <div className={styles.frequencyContent}>
              <TuesteTreeEyebrow>Frecuencia del lote</TuesteTreeEyebrow>
              <h3>Lote 000 · 1.840 m</h3>
              <p>
                Una pieza nacida de la lluvia, el cultivo y la escucha de la Finca Tres Esquinas.
              </p>
              <a className={styles.frequencyButton} href="/experiencia#escucha">
                Escuchar el lote <span aria-hidden="true">→</span>
              </a>
            </div>
          </article>
        </aside>
      </div>
      <p className={styles.treeMeta}>
        {MI_ARBOL_DEMO.altitud} · {MI_ARBOL_DEMO.variedad} · Finca Tres Esquinas
      </p>
    </section>
  );
}
