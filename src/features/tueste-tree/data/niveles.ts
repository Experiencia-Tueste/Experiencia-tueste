/**
 * Datos fundacionales de Tueste Tree — estructura del Lote 000 Founders.
 *
 * Tomados del mockup aprobado de José (escalera fundacional del
 * dashboard). Cifras literales del mockup: sin cálculo en runtime.
 */

export interface NivelFundacional {
  /** Identificador estable del nivel. */
  id: string;
  /** Etiqueta del nivel (Nivel 01…06). */
  nivel: string;
  /** Nombre en español (mockup). */
  nombre: string;
  /** Nombre en inglés (mockup). */
  nombreEn: string;
  /** Rango de árboles del nivel. */
  arboles: string;
  /** Participación referencial. */
  equity: string;
  /** Monto de referencia en USD. */
  usd: string;
  /** Nota editorial del nivel. */
  nota: string;
  /** Descripción breve del nivel (editorial, sin promesas). */
  descripcion: string;
}

/** Seis niveles fundacionales (escalera del mockup). */
export const NIVELES_FUNDACIONALES: readonly NivelFundacional[] = [
  {
    id: 'entrada-simbolica',
    nivel: 'Nivel 01',
    nombre: 'Entrada simbólica',
    nombreEn: 'Symbolic entry',
    arboles: '1–29 árboles',
    equity: 'desde 0,003%',
    usd: 'USD 100+',
    nota: 'Early adopters',
    descripcion:
      'La entrada al origen: una intención simbólica puesta en la tierra. Referencia editorial.',
  },
  {
    id: 'inversionista-pequeno',
    nivel: 'Nivel 02',
    nombre: 'Inversionista pequeño',
    nombreEn: 'Small investor',
    arboles: 'desde 30 árboles',
    equity: '0,088%',
    usd: 'USD 3.000',
    nota: 'Socio fundador',
    descripcion:
      'Un paso firme de cofundación: tu árbol y tu nombre en la memoria del lote. Referencia editorial.',
  },
  {
    id: 'inversionista-medio',
    nivel: 'Nivel 03',
    nombre: 'Inversionista medio',
    nombreEn: 'Mid investor',
    arboles: 'desde 50 árboles',
    equity: '0,147%',
    usd: 'USD 5.000',
    nota: 'Acceso a Casa Tueste',
    descripcion:
      'Cofundación media con acceso al espacio de origen cuando exista. Referencia editorial.',
  },
  {
    id: 'inversionista-estrategico',
    nivel: 'Nivel 04',
    nombre: 'Inversionista estratégico',
    nombreEn: 'Strategic investor',
    arboles: 'desde 100 árboles',
    equity: '0,294%',
    usd: 'USD 10.000',
    nota: 'Consejo de Fundadores',
    descripcion:
      'A partir de aquí se entra al Consejo de Fundadores del proyecto. Referencia editorial.',
  },
  {
    id: 'inversionista-mayorista',
    nivel: 'Nivel 05',
    nombre: 'Inversionista mayorista',
    nombreEn: 'Wholesale investor',
    arboles: 'desde 500 árboles',
    equity: '1,47%',
    usd: 'USD 50.000',
    nota: 'Co-branding y exportación',
    descripcion:
      'Cofundación mayorista: prioridad en lotes de exportación y co-branding. Referencia editorial.',
  },
  {
    id: 'inversionista-ancla',
    nivel: 'Nivel 06',
    nombre: 'Inversionista ancla',
    nombreEn: 'Anchor investor',
    arboles: 'desde 1.000 árboles',
    equity: '2,94%',
    usd: 'USD 100.000',
    nota: 'Socio ancla global',
    descripcion: 'La cofundación mayor: un vínculo global con el origen. Referencia editorial.',
  },
];

/** Lote fundacional del mockup (datos literales de referencia). */
export const LOTE_000_FOUNDERS = {
  nombre: 'Lote 000 Founders',
  arboles: 10200,
  precioReferenciaUsd: 100,
  capitalObjetivoUsd: 1020000,
  equityReferenciaPorArbol: '0,00294%',
  participacionProyecto: '30%',
} as const;

export function getNivel(id: string): NivelFundacional | undefined {
  return NIVELES_FUNDACIONALES.find((n) => n.id === id);
}
