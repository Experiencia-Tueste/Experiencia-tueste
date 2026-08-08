'use client';

import { useState } from 'react';
import { getTrack } from '@/features/audio';
import { ORIGEN_PASOS } from '@/features/origen';
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

/** Topografía decorativa de los marcos editoriales (SVG del mockup). */
function Topografia() {
  return (
    <svg
      className={styles.topo}
      viewBox="0 0 400 225"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="rgba(255,232,191,0.13)" strokeWidth="1.1">
        <path d="M60 180c30-38 74-52 118-46s86 34 128 22 62-48 78-84" />
        <path d="M40 196c38-46 90-64 142-56s100 40 150 24 70-56 84-98" />
        <path d="M84 166c24-30 60-42 96-37s70 27 104 17 50-38 62-68" />
        <path d="M110 152c18-22 44-31 71-27s52 20 77 12 37-28 46-50" />
        <path d="M136 140c12-15 30-21 48-18s35 13 52 8 25-19 31-34" />
      </g>
      <circle cx="205" cy="112" r="4.5" fill="rgba(251,169,34,0.85)" />
      <circle cx="205" cy="112" r="11" fill="none" stroke="rgba(251,169,34,0.4)" />
    </svg>
  );
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
            <Topografia />
            <figcaption className={styles.cap}>
              Finca Tres Esquinas · material del territorio en camino
            </figcaption>
          </figure>
          <figure className={styles.frame}>
            <Topografia />
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
