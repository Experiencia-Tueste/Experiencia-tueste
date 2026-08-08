'use client';

import { useState } from 'react';
import { TRACKS } from '@/features/audio';
import type { TrackId } from '@/lib/audio';
import BaristaSonoro from './BaristaSonoro';
import Comunidad from './Comunidad';
import Eventos from './Eventos';
import Frecuencias from './Frecuencias';
import Lanzamientos from './Lanzamientos';
import MercadoOrigen from './MercadoOrigen';
import NegociosRadio from './NegociosRadio';
import Origen from './Origen';
import Tienda from './Tienda';
import TuesteTree from './TuesteTree';

const MENSAJE_SIN_AUDIO = 'Audio disponible próximamente.';

/**
 * Límite de estado cliente de la experiencia de escucha.
 * Comparte `selectedTrackId` entre la sección Frecuencias (reproductor),
 * la sección Origen (frecuencias de cada etapa), la sección Música
 * (lanzamientos) y la sección Barista Sonoro (carta recomendada) sin
 * eventos DOM ni estado duplicado: todas reciben el mismo valor por props.
 * La sección Eventos (agenda pública) se renderiza al final sin estado
 * compartido: sus CTA solo anuncian en un aria-live local. La sección
 * Mercado de Origen (catálogo demo + vista previa local) y la sección
 * Comunidad (CTA público de correo) tampoco comparten estado: sus CTA
 * anuncian en un aria-live local.
 *
 * No implementa reproducción real: el botón principal solo anuncia
 * «Audio disponible próximamente.» en un área aria-live.
 */
export default function ListeningExperience() {
  const [selectedId, setSelectedId] = useState<TrackId>(TRACKS[0]?.id ?? '');
  const [mensaje, setMensaje] = useState<string | null>(null);

  const handleSelect = (id: TrackId) => {
    setSelectedId(id);
    setMensaje(null);
  };

  const handlePlay = () => {
    setMensaje(MENSAJE_SIN_AUDIO);
  };

  return (
    <>
      <Frecuencias
        selectedId={selectedId}
        onSelect={handleSelect}
        onPlay={handlePlay}
        mensaje={mensaje}
      />
      <Origen selectedId={selectedId} onSelect={handleSelect} />
      <Lanzamientos onSelect={handleSelect} />
      <BaristaSonoro onSelect={handleSelect} />
      <Eventos />
      <TuesteTree />
      <Tienda />
      <NegociosRadio onSelect={handleSelect} />
      <MercadoOrigen />
      <Comunidad />
    </>
  );
}
