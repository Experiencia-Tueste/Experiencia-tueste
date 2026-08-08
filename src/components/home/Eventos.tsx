'use client';

import { useState } from 'react';
import { EVENTS, reservaMensaje } from '@/features/events';
import type { EventItem } from '@/features/events';
import EventRow from './EventRow';
import Reveal from './Reveal';
import SectionGhost from './SectionGhost';
import styles from './Eventos.module.css';

/**
 * Sección «05 / EN VIVO» · Acto III · La pertenencia (#eventos).
 * Agenda pública con los cuatro eventos del mockup. Cada CTA solicita
 * la reserva y solo anuncia en un área aria-live local que la reserva
 * se habilitará cuando el cliente confirme la operación y el canal de
 * contacto: sin WhatsApp, teléfonos, pagos ni formularios.
 */
export default function Eventos() {
  const [anuncio, setAnuncio] = useState<string | null>(null);

  const handleReserva = (ev: EventItem) => setAnuncio(reservaMensaje(ev));

  return (
    <section id="eventos" className={styles.section} aria-labelledby="ev-titulo">
      <SectionGhost number="05" />
      <Reveal>
        <p className={styles.acto}>Acto III · La pertenencia</p>
      </Reveal>
      <Reveal>
        <div className={styles.sechead}>
          <span className={styles.secnum}>05 / EN VIVO</span>
        </div>
      </Reveal>
      <Reveal>
        <h2 id="ev-titulo" className={styles.title}>
          Vive el ritual <em>en persona</em>
        </h2>
      </Reveal>
      <Reveal>
        <p className={styles.lead}>
          El territorio también se vive en persona: rituales entre cafetales, catas donde el sonido
          y la taza son la misma cosa, y noches donde la montaña baja a la ciudad. Estas son las
          próximas fechas.
        </p>
      </Reveal>

      <Reveal>
        <div className={styles.events}>
          {EVENTS.map((ev) => (
            <EventRow key={ev.id} ev={ev} onReserva={handleReserva} />
          ))}
        </div>
      </Reveal>

      <p className={styles.live} role="status" aria-live="polite">
        {anuncio ?? '\u00A0'}
      </p>
    </section>
  );
}
