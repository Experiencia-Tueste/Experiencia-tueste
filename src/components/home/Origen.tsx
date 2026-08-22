'use client';

import { useState } from 'react';
import { getTrack } from '@/features/audio';
import { ORIGEN_PASOS } from '@/features/origen';
import type { AudioPlayerResult } from '@/hooks/useAudioPlayer';
import OrigenStep from './OrigenStep';
import Reveal from './Reveal';
import SectionGhost from './SectionGhost';
import styles from './Origen.module.css';

export interface OrigenProps {
  /** Reproductor global compartido (Frecuencias, Música, Radio…). */
  player: AudioPlayerResult;
}

/**
 * Sección «02 / EL ORIGEN» · las cinco etapas del territorio y su
 * conversión en frecuencia.
 *
 * Cada tarjeta controla su melodía con el reproductor GLOBAL existente
 * (sin <audio> ni AudioContext adicionales):
 * - activar una tarjeta distinta reproduce su pista desde el comienzo;
 * - activar la tarjeta que suena la pausa;
 * - activar la tarjeta seleccionada pero pausada la reanuda.
 *
 * El reproductor permanece sincronizado: mismo trackId, mismo estado
 * de reproducción que Frecuencias/Música/Radio. Sin autoplay: todo
 * nace de la acción real del usuario.
 */
export default function Origen({ player }: OrigenProps) {
  const [anuncio, setAnuncio] = useState<string | null>(null);

  const handleCard = (id: Parameters<typeof player.play>[0]) => {
    if (player.trackId === id) {
      // Misma tarjeta: alterna pausa/reanudación de su melodía.
      player.togglePlay();
    } else {
      // Tarjeta distinta: cambia a esa pista e inicia desde el comienzo.
      player.play(id);
    }
    const track = getTrack(id);
    setAnuncio(track ? `Frecuencia seleccionada: ${track.title} · ${track.hz} Hz` : null);
  };

  return (
    <section id="origen" className={styles.section} aria-labelledby="origen-titulo">
      <SectionGhost number="02" />
      <Reveal>
        <div className={styles.sechead}>
          <span className={styles.secnum}>02 / EL ORIGEN</span>
        </div>
      </Reveal>
      <Reveal>
        <h2 id="origen-titulo" className={styles.title}>
          Todo empieza en <em>la tierra</em>
        </h2>
      </Reveal>
      <Reveal>
        <p className={styles.lead}>
          Finca Tres Esquinas, montañas del Quindío. Antes de ser música, cada pieza fue lluvia
          sobre las hojas, cerezas madurando despacio y manos que conocen la montaña. Este es el
          territorio que suena — y así se convierte en frecuencia.
        </p>
      </Reveal>
      <Reveal>
        <p className={styles.coords}>
          4°32′ N · 75°39′ O &nbsp;·&nbsp; 1.450–1.800 m s. n. m. &nbsp;·&nbsp; Eje Cafetero,
          Colombia
        </p>
      </Reveal>

      <Reveal>
        <div className={styles.proc}>
          {ORIGEN_PASOS.map((paso) => (
            <OrigenStep
              key={paso.id}
              paso={paso}
              seleccionado={player.trackId === paso.trackId}
              reproduciendo={player.trackId === paso.trackId && player.playing}
              onToggle={() => handleCard(paso.trackId)}
            />
          ))}
        </div>
      </Reveal>

      <p className={styles.live} role="status" aria-live="polite">
        {anuncio ?? '\u00A0'}
      </p>

      <Reveal>
        <div className={styles.voces}>
          <p>
            “Aquí el café no se cultiva en silencio: la montaña suena todo el día. Nosotros solo
            aprendimos a escucharla.”
          </p>
          <span>
            Voces del origen · los nombres y rostros de quienes cultivan este sonido llegan pronto a
            este capítulo
          </span>
        </div>
      </Reveal>
    </section>
  );
}
