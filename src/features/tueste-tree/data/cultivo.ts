/**
 * Cultivo del Drop 000 — soles editoriales del dashboard y árboles del
 * lote para el ritual de adopción.
 *
 * Composición determinista (sin aleatoriedad): 30 soles del dashboard
 * y 300 árboles del lote con patrón fijo de adoptados. Ningún árbol
 * representa una adopción real; los estados son demostrativos.
 */

export type SolEstado = 'disponible' | 'adoptado';

export interface SolCultivo {
  /** Identificador estable del sol (árbol). */
  id: string;
  /** Número editorial de tres dígitos (001…030). */
  numero: string;
  /** Lote al que pertenece el sol. */
  lote: string;
  /** Estado demostrativo. */
  estado: SolEstado;
}

/** Soles del cultivo: 24 disponibles y 6 adoptados, en orden fijo. */
const ADOPTADOS = new Set(['004', '009', '014', '019', '024', '028']);

export const SOLES_CULTIVO: readonly SolCultivo[] = Array.from({ length: 30 }, (_, i) => {
  const numero = String(i + 1).padStart(3, '0');
  return {
    id: `sol-${numero}`,
    numero,
    lote: 'Lote 000 Founders',
    estado: ADOPTADOS.has(numero) ? 'adoptado' : 'disponible',
  };
});

/* ── Árboles del lote (ritual de adopción) ─────────────────────────── */

export type ArbolGroveEstado = 'disponible' | 'adoptado';

export interface ArbolGrove {
  id: string;
  /** Número editorial de tres dígitos (001…300). */
  numero: string;
  /** Estado fijo del patrón (la selección temporal vive en React). */
  estado: ArbolGroveEstado;
}

/** Patrón fijo de árboles adoptados: cada 7.º más una dispersión fija. */
const GROVE_ADOPTADOS: ReadonlySet<number> = new Set([
  7, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 91, 98, 105, 112, 119, 126, 133, 140, 147, 154,
  161, 168, 175, 182, 189, 196, 203, 210, 217, 224, 231, 238, 245, 252, 259, 266, 273, 280, 287,
  294, 11, 37, 88, 143, 201, 268,
]);

/** 300 árboles deterministas del Lote 000 Founders (25 × 12). */
/** Busca un árbol del lote por id. */
export function getArbol(id: string): ArbolGrove | undefined {
  return ARBOLES_GROVE.find((a) => a.id === id);
}

export const ARBOLES_GROVE: readonly ArbolGrove[] = Array.from({ length: 300 }, (_, i) => {
  const numero = i + 1;
  return {
    id: `arbol-${String(numero).padStart(3, '0')}`,
    numero: String(numero).padStart(3, '0'),
    estado: GROVE_ADOPTADOS.has(numero) ? 'adoptado' : 'disponible',
  };
});
