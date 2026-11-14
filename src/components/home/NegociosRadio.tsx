'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { RADIO_DEMO_OPTIONS } from '@/features/audio';
import type { RadioDemoOption } from '@/features/audio';
import type { EngagementInput } from '@/features/engagements';
import { RADIO_PLANS } from '@/features/radio';
import type { RadioPlan } from '@/features/radio';
import { loginPath, submitEngagement } from './engagement-client';
import { trackAnalytics } from '@/features/analytics/client';
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
  /** Activa una señal y reproduce su cola en el reproductor global. */
  onSelectChannel: (option: RadioDemoOption) => void;
}

/**
 * Bloque B2B (#negocios) + sección «08 / RADIO ORIGEN» (#radio).
 * «Probar la Señal Café» activa el canal `cafe` y reproduce su cola
 * (RADIO_DEMO_OPTIONS de features/audio), anunciando el resultado
 * localmente. Los planes registran una solicitud autenticada: el equipo
 * confirma operación y condiciones antes de activar una suscripción.
 */
export default function NegociosRadio({ onSelectChannel }: NegociosRadioProps) {
  const [anuncio, setAnuncio] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [openPlan, setOpenPlan] = useState<RadioPlan['id'] | null>(null);
  const router = useRouter();

  const probarSenal = () => {
    const cafe = RADIO_DEMO_OPTIONS.find((option) => option.id === 'cafe');
    if (!cafe) return;
    onSelectChannel(cafe);
    setAnuncio('Señal Café activa en el reproductor y encadenando piezas.');
  };

  const suscribir = async (plan: RadioPlan, event: FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    const data = new FormData(form);
    const optional = (name: string) => {
      const value = String(data.get(name) ?? '').trim();
      return value || undefined;
    };
    const payload: Extract<EngagementInput, { type: 'radio' }>['payload'] = {
      company: String(data.get('company') ?? '').trim(),
      responsible: String(data.get('responsible') ?? '').trim(),
      phone: optional('phone'),
      city: String(data.get('city') ?? '').trim(),
      businessType: String(data.get('businessType') ?? '').trim(),
      locations: Number(data.get('locations')),
      hours: String(data.get('hours') ?? '').trim(),
      comment: optional('comment'),
      consent: true,
    };
    setPendingPlan(plan.id);
    const result = await submitEngagement({
      type: 'radio',
      reference: plan.id,
      payload,
    });
    setPendingPlan(null);
    if (result.kind === 'login') {
      setAnuncio('Inicia sesión con tu cuenta Tueste para solicitar este plan.');
      router.push(loginPath('radio'));
      return;
    }
    if (result.kind === 'ok') {
      void trackAnalytics('radio_request_submitted', { planId: plan.id });
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
                  onClick={() => setOpenPlan((current) => (current === plan.id ? null : plan.id))}
                  disabled={pendingPlan === plan.id}
                  aria-expanded={openPlan === plan.id}
                  aria-controls={`radio-request-${plan.id}`}
                >
                  {pendingPlan === plan.id ? 'Enviando…' : 'Solicitar plan'}
                </button>
                {openPlan === plan.id ? (
                  <form
                    id={`radio-request-${plan.id}`}
                    className={styles.requestForm}
                    onSubmit={(event) => suscribir(plan, event)}
                  >
                    <div className={styles.requestGrid}>
                      <label className={styles.field}>
                        Empresa *
                        <input name="company" required maxLength={160} autoFocus />
                      </label>
                      <label className={styles.field}>
                        Responsable *
                        <input name="responsible" required maxLength={160} />
                      </label>
                      <label className={styles.field}>
                        Ciudad *
                        <input name="city" required maxLength={120} />
                      </label>
                      <label className={styles.field}>
                        Tipo de negocio *
                        <input
                          name="businessType"
                          required
                          maxLength={100}
                          placeholder="Café, hotel…"
                        />
                      </label>
                      <label className={styles.field}>
                        Sedes *
                        <input
                          name="locations"
                          type="number"
                          min={1}
                          max={1000}
                          defaultValue={1}
                          required
                        />
                      </label>
                      <label className={styles.field}>
                        Horario *
                        <input
                          name="hours"
                          required
                          maxLength={120}
                          placeholder="Lun–Dom, 8:00–18:00"
                        />
                      </label>
                      <label className={styles.field}>
                        Teléfono
                        <input name="phone" type="tel" maxLength={40} />
                      </label>
                      <label className={`${styles.field} ${styles.wide}`}>
                        Comentario operativo
                        <textarea name="comment" maxLength={500} rows={3} />
                      </label>
                    </div>
                    <label className={styles.consent}>
                      <input name="consent" type="checkbox" required />
                      Acepto que Tueste use estos datos para evaluar la solicitud comercial.
                    </label>
                    <div className={styles.requestActions}>
                      <button
                        type="submit"
                        className={styles.requestSubmit}
                        disabled={pendingPlan === plan.id}
                      >
                        {pendingPlan === plan.id ? 'Enviando…' : 'Enviar solicitud'}
                      </button>
                      <button
                        type="button"
                        className={styles.requestCancel}
                        onClick={() => setOpenPlan(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : null}
              </article>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <p className={styles.note}>
            Esta es una demostración con audio local; no representa todavía un servicio desplegado
            24/7. Tu solicitud se revisa antes de cualquier facturación o activación, y el equipo
            confirmará el alcance del servicio para tu espacio.
          </p>
        </Reveal>

        <p className={styles.live} role="status" aria-live="polite">
          {anuncio ?? '\u00A0'}
        </p>
      </section>
    </>
  );
}
