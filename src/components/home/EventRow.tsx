'use client';

import { useState, type FormEvent } from 'react';
import {
  isReservable,
  type EventItem,
  type EventRequestPayload,
  type EventStatus,
} from '@/features/events';
import styles from './EventRow.module.css';

export interface EventRowProps {
  ev: EventItem;
  /** Solicita un cupo; el equipo confirma luego una reserva real. */
  onReserva: (ev: EventItem, payload: EventRequestPayload) => Promise<void>;
  loading?: boolean;
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
 * pasado queda atenuado con la acción deshabilitada; los demás abren un
 * formulario inline para solicitar cupo sin prometer una reserva inmediata.
 */
export default function EventRow({ ev, onReserva, loading = false }: EventRowProps) {
  const reservable = isReservable(ev);
  const [formOpen, setFormOpen] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [city, setCity] = useState(ev.city);
  const [comment, setComment] = useState('');
  const [consent, setConsent] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onReserva(ev, {
      attendeeCount,
      city: city.trim() || undefined,
      comment: comment.trim() || undefined,
      consent: true,
    });
    setFormOpen(false);
  };

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
          {reservable && ev.status === 'few' ? ' · cupos limitados' : ''}
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
          disabled={!reservable || loading}
          aria-expanded={reservable ? formOpen : undefined}
          aria-controls={reservable ? `request-${ev.id}` : undefined}
          onClick={() => {
            if (reservable) setFormOpen((open) => !open);
          }}
        >
          {loading ? 'Enviando…' : ev.cta}
        </button>
      </div>

      {formOpen ? (
        <form id={`request-${ev.id}`} className={styles.requestForm} onSubmit={submit}>
          <div className={styles.requestFields}>
            <label>
              Asistentes
              <input
                autoFocus
                type="number"
                min={1}
                max={20}
                value={attendeeCount}
                onChange={(event) => setAttendeeCount(Number(event.target.value))}
                required
              />
            </label>
            <label>
              Ciudad
              <input
                type="text"
                value={city}
                maxLength={120}
                onChange={(event) => setCity(event.target.value)}
              />
            </label>
            <label className={styles.comment}>
              Nota opcional
              <input
                type="text"
                value={comment}
                maxLength={500}
                placeholder="¿Algo que debamos saber?"
                onChange={(event) => setComment(event.target.value)}
              />
            </label>
          </div>
          <label className={styles.consent}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              required
            />
            Acepto que Tueste use estos datos para gestionar mi solicitud.
          </label>
          <div className={styles.requestActions}>
            <button type="submit" className={styles.requestSubmit} disabled={loading || !consent}>
              {loading ? 'Enviando…' : 'Enviar solicitud'}
            </button>
            <button
              type="button"
              className={styles.requestCancel}
              onClick={() => setFormOpen(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}
    </article>
  );
}
