'use client';

import { useState } from 'react';
import { COMUNIDAD_CTA, comunidadMensaje } from '@/features/community';
import styles from './Comunidad.module.css';

/**
 * Sección «10 / COMUNIDAD» (#comunidad): CTA público de pertenencia con
 * formulario compacto de correo. Sin foro, posts ni reacciones todavía:
 * esta fase es solo la invitación pública.
 *
 * El formulario usa validación nativa de correo y no guarda, envía ni
 * persiste ningún dato. En un submit válido se resetea el formulario y se
 * anuncia en aria-live un mensaje genérico (sin repetir el correo) que
 * la comunidad se habilitará cuando el cliente confirme el flujo y el
 * tratamiento de datos. Sin CRM, Supabase, auth, WhatsApp, localStorage,
 * cookies, APIs, analytics, pagos ni enlaces externos.
 */
export default function Comunidad() {
  const [anuncio, setAnuncio] = useState<string | null>(null);

  const unirme = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAnuncio(comunidadMensaje());
    e.currentTarget.reset();
  };

  return (
    <section id="comunidad" className={styles.section} aria-labelledby="comunidad-titulo">
      <div className={styles.wrap}>
        <div className={styles.sechead}>
          <span className={styles.secnum}>{COMUNIDAD_CTA.encabezado}</span>
        </div>
        <h2 id="comunidad-titulo" className={styles.big}>
          No solo lo escuchas.
          <br />
          <em>Lo vives.</em>
        </h2>
        <p className={styles.lead}>{COMUNIDAD_CTA.texto}</p>

        <form className={styles.signup} onSubmit={unirme}>
          <label className={styles.srOnly} htmlFor="comunidad-correo">
            Correo
          </label>
          <input
            id="comunidad-correo"
            type="email"
            name="correo"
            required
            autoComplete="email"
            placeholder={COMUNIDAD_CTA.placeholderCorreo}
          />
          <button type="submit" className={styles.btn}>
            {COMUNIDAD_CTA.cta}
          </button>
        </form>
        <p className={styles.aviso}>{COMUNIDAD_CTA.aviso}</p>

        <p className={styles.live} role="status" aria-live="polite">
          {anuncio ?? '\u00A0'}
        </p>

        <div className={styles.cierre}>
          <p className={styles.ciLine}>
            El café también <em>se escucha.</em>
          </p>
          <a href="#frecuencias" className={styles.back}>
            ▶ {COMUNIDAD_CTA.volver}
          </a>
        </div>
      </div>
    </section>
  );
}
