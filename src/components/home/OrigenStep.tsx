import type { ReactNode } from 'react';
import { getTrack } from '@/features/audio';
import type { OrigenPaso, OrigenIcono } from '@/features/origen';
import styles from './OrigenStep.module.css';

/** Iconos decorativos de cada etapa, tomados del mockup (SVG inline). */
const ICONOS: Record<OrigenIcono, ReactNode> = {
  tierra: (
    <>
      <path d="M12 21c-5 0-8-3-8-7 0-5 8-11 8-11s8 6 8 11c0 4-3 7-8 7Z" />
      <path d="M12 21v-8" />
    </>
  ),
  agua: <path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11Z" />,
  flor: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </>
  ),
  fuego: (
    <path d="M12 22c4 0 7-2.8 7-6.5 0-4.5-4-6-4-9.5-2.5 1.5-3 3.5-3 5-1.5-1-2-2.5-2-4C7 9 5 11.5 5 15.5 5 19.2 8 22 12 22Z" />
  ),
  sonido: <path d="M2 12h3l2.5-6 4 12 3-8 2 4h5.5" />,
};

export interface OrigenStepProps {
  paso: OrigenPaso;
  /** true si la pista asociada es la seleccionada en el reproductor. */
  seleccionado: boolean;
  /** true si la pista de esta tarjeta está sonando en el reproductor global. */
  reproduciendo: boolean;
  /** Alterna reproducir/pausar/reanudar la melodía de esta tarjeta. */
  onToggle: () => void;
}

/**
 * Etapa del origen. La TARJETA COMPLETA es un único control real: un
 * `<button>` estilizado como tarjeta (sin botones anidados) que
 * reproduce/pausa/reanuda su melodía a través del reproductor GLOBAL
 * (nunca un <audio> propio):
 * - pista distinta: cambia e inicia desde cero;
 * - pista actual sonando: pausa;
 * - pista actual pausada: reanuda.
 *
 * Navegable con Tab, activable con Enter/Espacio, con foco visible,
 * `aria-pressed` y `aria-label` con la acción y el nombre de la pista.
 * El texto visible indica «Reproducir · 111 Hz» o «Pausar · 111 Hz».
 */
export default function OrigenStep({
  paso,
  seleccionado,
  reproduciendo,
  onToggle,
}: OrigenStepProps) {
  const track = getTrack(paso.trackId);
  const hz = track?.hz;
  const suenaEsta = seleccionado && reproduciendo;
  const accion = suenaEsta ? 'Pausar' : 'Reproducir';
  const etiqueta = `${accion} ${paso.titulo} · ${track?.title ?? paso.titulo}`;

  return (
    <button
      type="button"
      className={`${styles.step}${suenaEsta ? ` ${styles.on}` : ''}`}
      aria-pressed={suenaEsta}
      aria-label={etiqueta}
      onClick={onToggle}
    >
      <i className={styles.fase}>{paso.fase}</i>
      <svg className={styles.icono} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {ICONOS[paso.icono]}
      </svg>
      <b className={styles.titulo}>{paso.titulo}</b>
      <span className={styles.desc}>{paso.descripcion}</span>
      <span className={`${styles.play}${suenaEsta ? ` ${styles.playOn}` : ''}`} aria-hidden="true">
        <span aria-hidden="true">{suenaEsta ? '❚❚' : '▶'}</span> {accion} · {hz} Hz
      </span>
    </button>
  );
}
