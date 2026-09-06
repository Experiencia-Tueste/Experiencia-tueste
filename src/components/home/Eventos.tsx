'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EVENTS } from '@/features/events';
import type { EventItem } from '@/features/events';
import { loginPath, submitEngagement } from './engagement-client';
import EventRow from './EventRow';
import Reveal from './Reveal';
import SectionGhost from './SectionGhost';
import styles from './Eventos.module.css';

/**
 * Sección «05 / EN VIVO» · Acto III · La pertenencia (#eventos).
 * Agenda editorial. Las acciones guardan una solicitud autenticada para
 * que el equipo confirme cupo y condiciones antes de emitir una reserva.
 */
export default function Eventos() {
  const [anuncio, setAnuncio] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const router = useRouter();

  const handleReserva = async (ev: EventItem) => {
    setPendingId(ev.id);
    const result = await submitEngagement({
      type: 'event',
      reference: ev.id,
      details: `${ev.title} · ${ev.city} · ${ev.dateTime}`,
    });
    setPendingId(null);
    if (result.kind === 'login') {
      setAnuncio('Inicia sesión con tu cuenta Tueste para solicitar un cupo.');
      router.push(loginPath('eventos'));
      return;
    }
    setAnuncio(result.message);
  };

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
            <EventRow key={ev.id} ev={ev} onReserva={handleReserva} loading={pendingId === ev.id} />
          ))}
        </div>
      </Reveal>

      <p className={styles.live} role="status" aria-live="polite">
        {anuncio ?? '\u00A0'}
      </p>
    </section>
  );
}
