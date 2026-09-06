'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getChannel, getTrack } from '@/features/audio';
import type { TrackId } from '@/lib/audio';
import { RADIO_PLANS } from '@/features/radio';
import type { RadioPlan } from '@/features/radio';
import { loginPath, submitEngagement } from './engagement-client';
import SectionGhost from './SectionGhost';
import Reveal from './Reveal';
import styles from './NegociosRadio.module.css';

/** Acento de marca por plan (CSS variable --pc, del mockup). */
const ACCENT: Record<RadioPlan['accent'], string> = {
  teal: 'var(--teal-bright)',
  amber: 'var(--amber)',
  coral: 'var(--coral)',
};

export interface NegociosRadioProps {
  /** Selecciona una pista en el reproductor (estado compartido). */
  onSelect: (id: TrackId) => void;
}

/**
 * Bloque B2B (#negocios) + sección «08 / RADIO ORIGEN» (#radio).
 * «Probar la Señal Café» selecciona el primer track del canal `cafe`
 * (RADIO_CHANNELS/getChannel de features/audio) y anuncia el resultado
 * localmente. Los planes registran una solicitud autenticada: el equipo
 * confirma operación y condiciones antes de activar una suscripción.
 */
export default function NegociosRadio({ onSelect }: NegociosRadioProps) {
  const [anuncio, setAnuncio] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const router = useRouter();

  const probarSenal = () => {
    const canal = getChannel('cafe');
    const primer = canal?.queue[0];
    if (primer) onSelect(primer);
    const nombre = primer ? getTrack(primer)?.title : undefined;
    setAnuncio(`Señal Café seleccionada en el reproductor${nombre ? `: «${nombre}»` : ''}.`);
  };

  const suscribir = async (plan: RadioPlan) => {
    setPendingPlan(plan.id);
    const result = await submitEngagement({
      type: 'radio',
      reference: plan.id,
      details: `${plan.nombre} · USD ${plan.priceUsd}/mes`,
    });
    setPendingPlan(null);
    if (result.kind === 'login') {
      setAnuncio('Inicia sesión con tu cuenta Tueste para solicitar este plan.');
      router.push(loginPath('radio'));
      return;
    }
    setAnuncio(result.message);
  };

  return (
    <>
      <div id="negocios" className={styles.b2b} aria-labelledby="b2b-titulo">
        <Reveal>
          <span className={styles.kick}>Para negocios</span>
        </Reveal>
        <Reveal>
          <h2 id="b2b-titulo" className={styles.b2bTitle}>
            Tueste, para tu <em>espacio</em>
          </h2>
        </Reveal>
        <Reveal>
          <p>
            Dos servicios por suscripción para cafés, hoteles, tiendas y marcas de café: la radio
            que hace sonar tu negocio y el mercado donde vendes tu café directo.
          </p>
        </Reveal>
      </div>

      <section id="radio" className={styles.section} aria-labelledby="radio-titulo">
        <SectionGhost number="08" />
        <Reveal>
          <div className={styles.sechead}>
            <span className={styles.secnum}>08 / RADIO ORIGEN</span>
          </div>
        </Reveal>
        <Reveal>
          <h2 id="radio-titulo" className={styles.title}>
            Tu espacio también <em>suena</em>
          </h2>
        </Reveal>
        <Reveal>
          <p className={styles.lead}>
            La plataforma de streaming de Origen Tostado para espacios: eliges tu señal y suena en
            continuo, con música original libre de líos de derechos. Tres niveles: la señal
            predeterminada, una diseñada por Tueste según tu tipo de negocio, o un canal totalmente
            personalizado. Servicio para usuarios registrados: solicita el plan y el equipo confirma
            el alcance antes de activar cualquier suscripción.
          </p>
        </Reveal>

        <Reveal>
          <div className={styles.demo}>
            <div>
              <b>Escúchala en vivo</b>
              <p>
                Las señales suenan en el reproductor de la página — la de la casa y las diseñadas
                por tipo de negocio, encadenando piezas en continuo. Elige una y déjala sonar.
              </p>
            </div>
            <button type="button" className={styles.glass} onClick={probarSenal}>
              Probar la Señal Café
            </button>
          </div>
        </Reveal>

        <Reveal>
          <div className={styles.plans}>
            {RADIO_PLANS.map((plan) => (
              <article
                className={`${styles.plan}${plan.destacado ? ` ${styles.pop}` : ''}`}
                key={plan.id}
                style={{ '--pc': ACCENT[plan.accent] } as React.CSSProperties}
              >
                {plan.destacado ? <span className={styles.badge}>Más elegido</span> : null}
                <span className={styles.name}>{plan.nombre}</span>
                <span className={styles.tag}>{plan.tag}</span>
                <div className={styles.price}>
                  <b>USD {plan.priceUsd}</b>
                  <span>/ mes</span>
                </div>
                <ul>
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={styles.btn}
                  onClick={() => suscribir(plan)}
                  disabled={pendingPlan === plan.id}
                >
                  {pendingPlan === plan.id ? 'Enviando…' : 'Solicitar plan'}
                </button>
              </article>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <p className={styles.note}>
            Servicio para usuarios registrados · sin permanencia · tu solicitud se revisa antes de
            cualquier facturación o activación. Todos los planes suenan en continuo, 24/7, desde
            cualquier dispositivo; pruébalos en el reproductor de la página.
          </p>
        </Reveal>

        <p className={styles.live} role="status" aria-live="polite">
          {anuncio ?? '\u00A0'}
        </p>
      </section>
    </>
  );
}
