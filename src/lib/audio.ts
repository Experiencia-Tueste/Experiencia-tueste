/**
 * Contrato compartido de audio.
 * ---------------------------------------------------------------------
 * `TrackId` es el identificador único de una pista de audio. Lo usan
 * tanto la feature `audio` (catálogo, colas de radio) como la feature
 * `barista` (pista asociada a cada método de preparación). Unificar la
 * referencia evita que un método apunte a un índice numérico que no
 * corresponde con los IDs string del catálogo.
 */

/** Identificador único de una pista de audio. */
export type TrackId = string;

/** Referencia a una pista del catálogo (id + título legible). */
export interface TrackRef {
  id: TrackId;
  title: string;
}
