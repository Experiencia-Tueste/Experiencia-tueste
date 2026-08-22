'use client';

import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import BaristaSonoro from './BaristaSonoro';
import Comunidad from './Comunidad';
import EditorialTicker from './EditorialTicker';
import Eventos from './Eventos';
import Frecuencias from './Frecuencias';
import Lanzamientos from './Lanzamientos';
import MercadoOrigen from './MercadoOrigen';
import NegociosRadio from './NegociosRadio';
import Origen from './Origen';
import Tienda from './Tienda';

/**
 * Límite de estado cliente de la experiencia de escucha: un único hook
 * useAudioPlayer (HTMLAudioElement + AudioContext + AnalyserNode) cuyo
 * resultado comparte la sección Frecuencias (reproductor), la sección
 * Origen (frecuencias de cada etapa), la sección Música (lanzamientos),
 * la sección Barista Sonoro (carta recomendada) y la sección Radio Origen
 * (probar la Señal Café) sin eventos DOM ni estado duplicado: todas
 * reciben el mismo objeto por props. La sección Eventos (agenda pública)
 * se renderiza al final sin estado compartido: sus CTA solo anuncian en
 * un aria-live local. La sección Mercado de Origen (catálogo demo + vista
 * previa local) y la sección Comunidad (CTA público de correo) tampoco
 * comparten estado: sus CTA anuncian en un aria-live local.
 *
 * La reproducción es real con previews MP3 locales (public/audio): el
 * deck alterna play/pausa, la lista selecciona pista y las señales de
 * radio encadenan piezas en continuo (ended → nextInQueue). El grafo de
 * audio se crea tras la primera interacción (autoplay policy).
 */
export default function ListeningExperience() {
  const player = useAudioPlayer();

  return (
    <>
      <Frecuencias player={player} />
      <Origen player={player} />
      <Lanzamientos onSelect={player.select} />
      <BaristaSonoro onSelect={player.select} />
      <EditorialTicker variant="dim" reverse />
      <Eventos />
      <Tienda />
      <EditorialTicker variant="amber" reverse alt />
      <NegociosRadio onSelect={player.select} />
      <MercadoOrigen />
      <Comunidad />
    </>
  );
}
