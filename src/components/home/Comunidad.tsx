'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { COMUNIDAD_CTA } from '@/features/community';
import { COMMUNITY_PREFERENCES, type CommunityPreference } from '@/features/engagements';
import { loginPath, submitEngagement } from './engagement-client';
import Reveal from './Reveal';
import SectionGhost from './SectionGhost';
import styles from './Comunidad.module.css';

/**
 * Sección «10 / COMUNIDAD» (#comunidad): CTA público de pertenencia con
 * mediante la cuenta Tueste ya autenticada. No se pide ni se acepta un
 * correo ajeno: el servidor deriva la identidad desde la sesión.
 */
export default function Comunidad() {
  const [anuncio, setAnuncio] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [preferences, setPreferences] = useState<CommunityPreference[]>(['general']);
  const [consent, setConsent] = useState(false);
  const router = useRouter();

  const unirme = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    const result = await submitEngagement({
      type: 'community',
      reference: 'membership',
      payload: { preferences, consent: true },
    });
    setPending(false);
    if (result.kind === 'login') {
      setAnuncio('Inicia sesión con tu cuenta Tueste para unirte a la comunidad.');
      router.push(loginPath('comunidad'));
      return;
    }
    setAnuncio(result.message);
  };

  return (
    <section id="comunidad" className={styles.section} aria-labelledby="comunidad-titulo">
      <SectionGhost number="10" side="start" />
      <div className={styles.wrap}>
        <Reveal>
          <div className={styles.sechead}>
            <span className={styles.secnum}>{COMUNIDAD_CTA.encabezado}</span>
          </div>
        </Reveal>
        <Reveal>
          <h2 id="comunidad-titulo" className={styles.big}>
            No solo lo escuchas.
            <br />
            <em>Lo vives.</em>
          </h2>
        </Reveal>
        <Reveal>
          <p className={styles.lead}>{COMUNIDAD_CTA.texto}</p>
        </Reveal>

        <Reveal>
          <form className={styles.signup} onSubmit={unirme}>
            <fieldset className={styles.preferences}>
              <legend>Quiero recibir novedades sobre:</legend>
              <div className={styles.preferenceGrid}>
                {COMMUNITY_PREFERENCES.filter((preference) => preference !== 'general').map(
                  (preference) => (
                    <label key={preference}>
                      <input
                        type="checkbox"
                        checked={preferences.includes(preference)}
                        onChange={(event) =>
                          setPreferences((current) => {
                            if (event.target.checked) {
                              return [...new Set([...current, preference])];
                            }
                            const next = current.filter((item) => item !== preference);
                            return next.length ? next : ['general'];
                          })
                        }
                      />
                      {preference === 'tree' ? 'Tueste Tree' : preference}
                    </label>
                  ),
                )}
              </div>
            </fieldset>
            <label className={styles.consent}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                required
              />
              Acepto recibir comunicaciones según mis preferencias.
            </label>
            <button type="submit" className={styles.btn} disabled={pending || !consent}>
              {pending ? 'Enviando…' : 'Unirme con mi cuenta'}
            </button>
          </form>
        </Reveal>
        <p className={styles.aviso}>{COMUNIDAD_CTA.aviso}</p>

        <p className={styles.live} role="status" aria-live="polite">
          {anuncio ?? '\u00A0'}
        </p>

        <Reveal>
          <div className={styles.cierre}>
            <p className={styles.ciLine}>
              El café también <em>se escucha.</em>
            </p>
            <a href="#frecuencias" className={styles.back}>
              ▶ {COMUNIDAD_CTA.volver}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
