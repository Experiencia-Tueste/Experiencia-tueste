'use client';

import { useState } from 'react';
import { getTrack } from '@/features/audio';
import { ORIGEN_PASOS } from '@/features/origen';
import OrigenMapPreview from '@/features/origen-map/components/OrigenMapPreview';
import { getPuntoMapa } from '@/features/origen-map/data/puntos';
import type { TrackId } from '@/lib/audio';
import OrigenStep from './OrigenStep';
import Reveal from './Reveal';
import SectionGhost from './SectionGhost';
import styles from './Origen.module.css';

export interface OrigenProps {
  /** Pista seleccionada actualmente (compartida con el reproductor). */
  selectedId: TrackId;
  /** Selecciona la pista de una etapa en el reproductor. */
  onSelect: (id: TrackId) => void;
}

/**
 * Sección «02 / EL ORIGEN» · las cinco etapas del territorio y su
 * conversión en frecuencia. Cada etapa es un botón real con aria-pressed
 * que selecciona su pista en el reproductor de Frecuencias a través del
 * estado compartido de ListeningExperience. Sin imágenes externas: los
 * marcos editoriales usan topografía SVG decorativa.
 */
export default function Origen({ selectedId, onSelect }: OrigenProps) {
  const [anuncio, setAnuncio] = useState<string | null>(null);

  const handleSelect = (id: TrackId) => {
    const track = getTrack(id);
    setAnuncio(track ? `Frecuencia seleccionada: ${track.title} · ${track.hz} Hz` : null);
    onSelect(id);
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
              seleccionado={selectedId === paso.trackId}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </Reveal>

      <p className={styles.live} role="status" aria-live="polite">
        {anuncio ?? '\u00A0'}
      </p>

      <Reveal>
        <div className={styles.media}>
          <figure className={styles.frame}>
            <OrigenMapPreview
              punto={getPuntoMapa('finca-tres-esquinas')!}
              etiqueta="Ubicación aproximada · demostración"
              className={styles.mapFrame}
            />
            <figcaption className={styles.cap}>
              Finca Tres Esquinas · material del territorio en camino
            </figcaption>
          </figure>
          <figure className={styles.frame}>
            <OrigenMapPreview
              punto={getPuntoMapa('guardianes-origen')!}
              etiqueta="Punto editorial · próximamente"
              className={styles.mapFrame}
            />
            <figcaption className={styles.cap}>Los guardianes del origen · próximamente</figcaption>
          </figure>
        </div>
      </Reveal>

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
