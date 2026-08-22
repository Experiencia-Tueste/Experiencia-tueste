'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { STAGES } from '../data/adoption-content';
import styles from './AdoptionCycle.module.css';

type Direction = 'next' | 'prev';

interface Transition {
  idx: number;
  dir: Direction;
}

/**
 * Línea de tiempo interactiva del ciclo del árbol (cinco etapas).
 *
 * Estado inicial determinista: etapa 01, sin fechas, aleatoriedad ni
 * datos del navegador durante el render inicial. Se muestra una etapa a
 * la vez: fotografía, número, nombre y frase.
 *
 * Navegación: botones reales «Anterior»/«Siguiente» con estados
 * disabled reales en los extremos, indicadores de progreso (botones con
 * `aria-current="step"` en el activo) y teclado (ArrowLeft/ArrowRight)
 * cuando el widget tiene foco. El cambio se anuncia mediante
 * `aria-live="polite"` en la tarjeta activa.
 *
 * Animación: transform + opacity (450–650 ms) con CSS Modules. Al
 * avanzar, la tarjeta saliente se desliza a la izquierda y la nueva
 * entra desde la derecha; al retroceder, la animación inversa. Con
 * prefers-reduced-motion el cambio es inmediato (sin nodos duplicados
 * ni animaciones).
 */
export default function AdoptionCycle() {
  const [index, setIndex] = useState(0);
  const [transition, setTransition] = useState<Transition | null>(null);

  // Primer render completamente determinista en servidor y cliente:
  // sin acceso a `window` en el inicializador de estado. La preferencia
  // de movimiento se consulta solo en el cliente, dentro de useEffect.
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduceMotion(media.matches);

    // Lectura inicial en cliente. Intencional: el primer render ya es
    // determinista e idéntico en servidor y cliente; este estado solo
    // condiciona la animación de futuras interacciones, por lo que el
    // re-render no altera el árbol ni produce divergencia de hidratación.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduceMotion(media.matches);

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange);
      return () => {
        media.removeEventListener('change', onChange);
      };
    }

    // Navegadores antiguos: API legada addListener/removeListener.
    media.addListener(onChange);
    return () => {
      media.removeListener(onChange);
    };
  }, []);

  const goTo = (next: number) => {
    if (next === index || next < 0 || next >= STAGES.length) return;
    if (reduceMotion) {
      setIndex(next);
      return;
    }
    setTransition({ idx: index, dir: next > index ? 'next' : 'prev' });
    setIndex(next);
  };

  const stage = STAGES[index];
  const out = transition ? STAGES[transition.idx] : null;
  const direction = transition?.dir ?? null;

  return (
    <div
      className={styles.cycle}
      role="group"
      aria-label="Ciclo del árbol: cinco etapas"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          goTo(index + 1);
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          goTo(index - 1);
        }
      }}
    >
      <div className={styles.viewport}>
        {out && (
          <article
            key={`out-${out.number}`}
            className={`${styles.card} ${styles.cardOut} ${
              direction === 'next' ? styles.exitLeft : styles.exitRight
            }`}
            aria-hidden="true"
            onAnimationEnd={() => setTransition(null)}
          >
            <CycleCard stage={out} />
          </article>
        )}
        <article
          key={`in-${stage.number}`}
          className={`${styles.card}${
            transition
              ? ` ${styles.cardIn} ${direction === 'next' ? styles.enterRight : styles.enterLeft}`
              : ''
          }`}
          aria-live="polite"
        >
          <CycleCard stage={stage} />
        </article>
      </div>

      <nav className={styles.nav} aria-label="Navegación del ciclo">
        <button
          type="button"
          className={styles.arrowButton}
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="Anterior: etapa anterior del ciclo"
        >
          <span aria-hidden="true">←</span>
          Anterior
        </button>

        <ol className={styles.indicators}>
          {STAGES.map((item, itemIndex) => (
            <li key={item.number} className={styles.indicatorItem}>
              <button
                type="button"
                className={styles.indicator}
                onClick={() => goTo(itemIndex)}
                aria-label={`Ir a la etapa ${item.number}: ${item.name}`}
                aria-current={itemIndex === index ? 'step' : undefined}
              >
                <span className={styles.indicatorDot} aria-hidden="true" />
                <span className={styles.indicatorLabel}>{item.name}</span>
              </button>
            </li>
          ))}
        </ol>

        <button
          type="button"
          className={styles.arrowButton}
          onClick={() => goTo(index + 1)}
          disabled={index === STAGES.length - 1}
          aria-label="Siguiente: etapa siguiente del ciclo"
        >
          Siguiente
          <span aria-hidden="true">→</span>
        </button>
      </nav>

      {/* Progreso compacto visible solo en móvil (escritorio usa los
          indicadores completos). Texto real y accesible. */}
      <p className={styles.mobileProgress}>
        Etapa {index + 1} de {STAGES.length}
      </p>
    </div>
  );
}

/** Contenido de una etapa: fotografía, número, nombre y frase. */
function CycleCard({ stage }: { stage: (typeof STAGES)[number] }) {
  return (
    <>
      <div className={styles.cardVisual}>
        <Image
          src={stage.imageSrc}
          alt={stage.imageAlt}
          fill
          sizes="(max-width: 780px) 100vw, 48vw"
          className={styles.cardImage}
        />
        <span className={styles.cardOverlay} aria-hidden="true" />
      </div>
      <div className={styles.cardBody}>
        <span className={styles.cardNumber} aria-hidden="true">
          {stage.number}
        </span>
        <h3 className={styles.cardName}>{stage.name}</h3>
        <p className={styles.cardPhrase}>{stage.phrase}</p>
      </div>
    </>
  );
}
