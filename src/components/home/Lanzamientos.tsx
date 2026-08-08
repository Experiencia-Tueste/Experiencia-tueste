'use client';

import { useState } from 'react';
import { RELEASES } from '@/features/music';
import type { TrackId } from '@/lib/audio';
import ListeningPlatforms from './ListeningPlatforms';
import ReleaseCard from './ReleaseCard';
import Reveal from './Reveal';
import SectionGhost from './SectionGhost';
import styles from './Lanzamientos.module.css';

const MENSAJE_COMPRA = 'Compra disponible próximamente.';

export interface LanzamientosProps {
  /** Selecciona la pista de un lanzamiento en el reproductor. */
  onSelect: (id: TrackId) => void;
}

/**
 * Sección «03 / MÚSICA» · la discografía del origen.
 * Grid de cuatro lanzamientos. «Escuchar» y el play de cada tarjeta
 * seleccionan la pista asociada y navegan a #frecuencias; los controles
 * de compra conservan la intención visual pero solo anuncian
 * «Compra disponible próximamente.» en un área aria-live. No hay
 * carrito, checkout ni pagos en esta iteración.
 */
export default function Lanzamientos({ onSelect }: LanzamientosProps) {
  const [anuncio, setAnuncio] = useState<string | null>(null);

  const handleBuy = () => setAnuncio(MENSAJE_COMPRA);

  return (
    <section id="lanzamientos" className={styles.section} aria-labelledby="lanz-titulo">
      <SectionGhost number="03" />
      <Reveal>
        <p className={styles.acto}>Acto II · La obra</p>
      </Reveal>
      <Reveal>
        <div className={styles.sechead}>
          <span className={styles.secnum}>03 / MÚSICA</span>
        </div>
      </Reveal>
      <Reveal>
        <h2 id="lanz-titulo" className={styles.title}>
          La <em>discografía</em> del origen
        </h2>
      </Reveal>
      <Reveal>
        <p className={styles.lead}>
          Cada lanzamiento es una temporada del café hecha sonido, publicada bajo el sello Logik
          Pro. Escúchalos, guárdalos y llévatelos en digital o en formato físico de colección.
        </p>
      </Reveal>

      <Reveal>
        <div className={styles.grid}>
          {RELEASES.map((release) => (
            <ReleaseCard key={release.id} release={release} onSelect={onSelect} onBuy={handleBuy} />
          ))}
        </div>
      </Reveal>

      <Reveal>
        <ListeningPlatforms />
      </Reveal>

      <p className={styles.live} role="status" aria-live="polite">
        {anuncio ?? '\u00A0'}
      </p>
    </section>
  );
}
