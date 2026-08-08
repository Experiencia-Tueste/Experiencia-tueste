'use client';

import { RADIO_DEMO_OPTIONS } from '@/features/audio';
import type { RadioChannelId, RadioDemoOption } from '@/features/audio';
import styles from './RadioDemo.module.css';

export interface RadioDemoProps {
  /** Señal encadenada activa (null = escucha libre). */
  channelId: RadioChannelId | null;
  /** Elige una señal (o «Escucha libre»). */
  onSelectChannel: (option: RadioDemoOption) => void;
  /** Mensaje global del reproductor a anunciar (aria-live). */
  mensaje: string | null;
}

/**
 * Demo de radio por suscripción (paridad visual del mockup): elige tu
 * tipo de negocio y su señal se activa en el reproductor. Componente
 * controlado: el chip activo deriva de `channelId` (estado del hook
 * useAudioPlayer), de modo que siempre hay exactamente un chip con
 * aria-pressed="true" y el estado no se duplica. El anuncio aria-live
 * llega por prop desde el reproductor. El enlace «Planes» es un ancla
 * interna a #radio.
 */
export default function RadioDemo({ channelId, onSelectChannel, mensaje }: RadioDemoProps) {
  return (
    <div className={styles.card} data-radiodemo>
      <div className={styles.head}>
        <span className={styles.tag}>Radio Origen · demo</span>
        <b className={styles.title}>¿Tienes un café, un hotel, una tienda?</b>
        <p className={styles.text}>
          Así suena la radio por suscripción en un espacio real: elige tu tipo de negocio y escucha
          su señal en continuo.
        </p>
      </div>

      <div className={styles.senales}>
        {RADIO_DEMO_OPTIONS.map((option) => {
          const activa = option.channel === channelId;
          return (
            <button
              key={option.id}
              type="button"
              className={`${styles.chip}${activa ? ` ${styles.on}` : ''}`}
              aria-pressed={activa}
              onClick={() => onSelectChannel(option)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <p className={styles.live} role="status" aria-live="polite">
        {mensaje ?? '\u00A0'}
      </p>

      <a className={styles.link} href="#radio">
        Planes desde USD 10/mes →
      </a>
    </div>
  );
}
