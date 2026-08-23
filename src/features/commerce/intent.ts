/**
 * Contrato tipado y PURO de intención comercial (sin cobro todavía).
 *
 * Define los identificadores estables que la siguiente fase de cobro
 * reutilizará para crear preferencias en servidor. Este archivo NO
 * tiene React, red, cobro, variables de entorno, cookies ni persistencia
 * del navegador: solo describe la forma de una intención comercial
 * dentro de la interfaz.
 */

/** Clase de intención comercial. */
export type CommercialIntentKind = 'release' | 'merchandise' | 'tree-adoption' | 'availability';

/** Estado editorial de la intención (sin pagos todavía). */
export type CommercialIntentStatus = 'informational' | 'catalog' | 'coming-soon';

/** Intención comercial: identificador estable + metadatos de UI. */
export interface CommercialIntent {
  /** Identificador estable y explícito (p. ej. `merch-vinilo-...`). */
  id: string;
  kind: CommercialIntentKind;
  /** Etiqueta visible del elemento comercial. */
  label: string;
  /** Componente/sección que la origina (solo trazabilidad, no ruta). */
  source: string;
  status: CommercialIntentStatus;
}

/** Prefijos de id por clase, para construir ids estables sin duplicarlos. */
export const INTENT_PREFIX: Record<CommercialIntentKind, string> = {
  release: 'release-',
  merchandise: 'merch-',
  'tree-adoption': 'tree-',
  availability: 'availability-',
};

/**
 * Construye un identificador estable a partir de una clase y un slug.
 * Determinista y sin dependencias del navegador.
 */
export function intentId(kind: CommercialIntentKind, slug: string): string {
  return `${INTENT_PREFIX[kind]}${slug}`;
}

/**
 * Ejemplos canónicos de intenciones comerciales de la interfaz. No son
 * datos dinámicos: son la nómina estable que usan los componentes para
 * exponer `data-commercial-intent`.
 */
export const COMMERCIAL_INTENTS = {
  'tree-drop-000': {
    id: 'tree-drop-000',
    kind: 'tree-adoption',
    label: 'Drop 000 · Cofundar un árbol',
    source: 'tueste-tree',
    status: 'informational',
  },
} as const satisfies Record<string, CommercialIntent>;
