'use client';

import type { EventItem, EventStatus } from '@/features/events';
import styles from './EventRow.module.css';

export interface EventRowProps {
  ev: EventItem;
  /** Solicita la reserva; el aria-live local lo gestiona la sección. */
  onReserva: (ev: EventItem) => void;
}

/** Variante del botón según estado; `open` usa el estilo base ámbar. */
const VARIANT: Record<EventStatus, string> = {
  few: styles.btnFew,
  open: '',
  wait: styles.btnWait,
  past: styles.btnPast,
};

/**
 * Fila editorial de un evento (del mockup): fecha visible en `<time>`,
 * tipo, título, ciudad · lugar · hora, precio opcional y CTA. El evento
 * pasado queda atenuado con la acción deshabilitada; los demás solicitan
 * la reserva a la sección (sin WhatsApp, pagos ni formularios).
 */
export default function EventRow({ ev, onReserva }: EventRowProps) {
  const reservable = ev.status !== 'past';

  return (
    <article
      className={`${styles.row}${reservable ? '' : ` ${styles.rowPast}`}`}
      aria-label={ev.title}
    >
      <time className={styles.date} dateTime={ev.dateTime}>
        <span className={styles.day}>{ev.day}</span>
        <span className={styles.month}>{ev.month}</span>
        <span className={styles.year}>{ev.year}</span>
      </time>

      <div className={styles.info}>
        <span className={`${styles.etype} ${styles[ev.type]}`}>
          {ev.type}
          {ev.status === 'few' ? ' · últimos cupos' : ''}
        </span>
        <h3 className={styles.title3}>{ev.title}</h3>
        <p className={styles.where}>
          <span className={styles.city}>{ev.city}</span>
          <span> · {ev.venue}</span>
          {ev.time ? <span> · {ev.time}</span> : null}
        </p>
      </div>

      <div className={styles.action}>
        {ev.price ? <span className={styles.price}>{ev.price}</span> : null}
        <button
          type="button"
          className={`${styles.btn} ${VARIANT[ev.status]}`}
          disabled={!reservable}
          onClick={() => {
            if (reservable) onReserva(ev);
          }}
        >
          {ev.cta}
        </button>
      </div>
    </article>
  );
}
