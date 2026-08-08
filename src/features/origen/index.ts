/**
 * Feature: origen
 * ---------------------------------------------------------------------
 * Las cinco etapas del origen (Germinación → Despertar) que aparecen en
 * la sección pública «02 / EL ORIGEN». Cada paso referencia una pista del
 * catálogo por `TrackId` (ver src/features/audio) sin duplicar el catálogo:
 * la frecuencia en Hz se resuelve con `getTrack(trackId).hz`.
 */

import type { TrackId } from '../../lib/audio';

/** Icono SVG decorativo asociado a cada etapa. */
export type OrigenIcono = 'tierra' | 'agua' | 'flor' | 'fuego' | 'sonido';

export interface OrigenPaso {
  /** Identificador único del paso. */
  id: string;
  /** Fase romana del proceso (I · Tierra, II · Agua…). */
  fase: string;
  /** Título de la etapa. */
  titulo: string;
  /** Descripción editorial de la etapa. */
  descripcion: string;
  /** Pista asociada del catálogo de audio. */
  trackId: TrackId;
  /** Icono decorativo de la etapa. */
  icono: OrigenIcono;
}

export const ORIGEN_PASOS: readonly OrigenPaso[] = [
  {
    id: 'germinacion',
    fase: 'I · Tierra',
    titulo: 'Germinación',
    descripcion: 'El silencio fértil de la montaña. Todo sonido empieza como semilla.',
    trackId: 'origen-111',
    icono: 'tierra',
  },
  {
    id: 'raiz',
    fase: 'II · Agua',
    titulo: 'Raíz',
    descripcion:
      'La lluvia baja por la hoja y entra a la tierra. El ritmo del agua es el primer bajo.',
    trackId: 'raiz-222',
    icono: 'agua',
  },
  {
    id: 'expansion',
    fase: 'III · Flor',
    titulo: 'Expansión',
    descripcion: 'La floración abre el aire. El cafetal entero vibra en blanco.',
    trackId: 'expansion-432',
    icono: 'flor',
  },
  {
    id: 'tostion',
    fase: 'IV · Fuego',
    titulo: 'Tostión',
    descripcion: 'El fuego transforma. Cada grano truena su propia nota antes de ser café.',
    trackId: 'coherencia-432',
    icono: 'fuego',
  },
  {
    id: 'despertar',
    fase: 'V · Sonido',
    titulo: 'Despertar',
    descripcion: 'El territorio, ya convertido en frecuencia, llega a tu taza y a tus oídos.',
    trackId: 'despertar-528',
    icono: 'sonido',
  },
];

export function getOrigenPaso(id: string): OrigenPaso | undefined {
  return ORIGEN_PASOS.find((p) => p.id === id);
}
