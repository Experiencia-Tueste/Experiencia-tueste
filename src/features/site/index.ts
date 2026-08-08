/**
 * Feature: site
 * ---------------------------------------------------------------------
 * Contrato estático del sitio público: secciones de navegación (única
 * fuente de hashes, etiquetas y numeración), grupos del footer, textos
 * de marca y cierre editorial. Todo es constante en build time: sin
 * fechas generadas en runtime, sin enlaces externos ni páginas
 * inexistentes.
 */

/** Hashes internos públicos, centralizados y validados por TypeScript. */
export const SECTION_IDS = {
  escucha: '#frecuencias',
  origen: '#origen',
  musica: '#lanzamientos',
  barista: '#recetario',
  enVivo: '#eventos',
  adopta: '#tueste-tree',
  tienda: '#merch',
  negocios: '#negocios',
  mercado: '#mercado',
  comunidad: '#comunidad',
} as const;

/** Id de sección pública: solo los hashes de SECTION_IDS. */
export type SectionId = (typeof SECTION_IDS)[keyof typeof SECTION_IDS];

/** Lugares donde una sección puede aparecer en la navegación. */
export type SectionPlacement = 'desktop' | 'mobile' | 'footer';

export interface PublicSection {
  /** Hash interno de la sección (centralizado en SECTION_IDS). */
  id: SectionId;
  /** Etiqueta visible. */
  label: string;
  /** Número para el menú móvil, cuando aplique. */
  num?: string;
  /** Disponibilidad en desktop, menú móvil y/o footer. */
  places: readonly SectionPlacement[];
}

/**
 * Secciones públicas del sitio, en orden canónico. Navbar desktop, menú
 * móvil y footer se derivan de aquí para no duplicar hashes ni etiquetas.
 */
export const PUBLIC_SECTIONS = [
  { id: SECTION_IDS.escucha, label: 'Escucha', num: '01', places: ['desktop', 'mobile', 'footer'] },
  { id: SECTION_IDS.origen, label: 'Origen', num: '02', places: ['desktop', 'mobile'] },
  { id: SECTION_IDS.musica, label: 'Música', num: '03', places: ['desktop', 'mobile', 'footer'] },
  { id: SECTION_IDS.barista, label: 'Barista', num: '04', places: ['desktop', 'mobile', 'footer'] },
  { id: SECTION_IDS.enVivo, label: 'En Vivo', num: '05', places: ['desktop', 'mobile'] },
  { id: SECTION_IDS.adopta, label: 'Adopta', num: '06', places: ['desktop', 'mobile', 'footer'] },
  { id: SECTION_IDS.tienda, label: 'Tienda', num: '07', places: ['desktop', 'mobile', 'footer'] },
  {
    id: SECTION_IDS.negocios,
    label: 'Negocios',
    num: '·',
    places: ['desktop', 'mobile', 'footer'],
  },
  { id: SECTION_IDS.mercado, label: 'Mercado de Origen', num: '09', places: ['footer'] },
  {
    id: SECTION_IDS.comunidad,
    label: 'Comunidad',
    num: '10',
    places: ['desktop', 'mobile', 'footer'],
  },
] as const satisfies readonly PublicSection[];

/** Devuelve la sección pública por su hash interno. */
export function getSection(id: SectionId): PublicSection | undefined {
  return PUBLIC_SECTIONS.find((s) => s.id === id);
}

/** Secciones disponibles en un lugar de navegación (orden canónico). */
export function sectionsIn(place: SectionPlacement): readonly PublicSection[] {
  return PUBLIC_SECTIONS.filter((s) => (s.places as readonly SectionPlacement[]).includes(place));
}

/** Hashes internos permitidos en el footer (derivados de la fuente). */
export const FOOTER_ALLOWED_HASHES: readonly SectionId[] = sectionsIn('footer').map((s) => s.id);

export type FooterHash = (typeof FOOTER_ALLOWED_HASHES)[number];

export interface FooterGroup {
  titulo: string;
  /** Secciones del grupo, referenciadas por id (sin duplicar labels). */
  sectionIds: readonly SectionId[];
}

/** Grupos de navegación del footer (tres columnas). */
export const FOOTER_GROUPS = [
  {
    titulo: 'Escuchar',
    sectionIds: [SECTION_IDS.escucha, SECTION_IDS.musica, SECTION_IDS.barista],
  },
  {
    titulo: 'Ecosistema',
    sectionIds: [SECTION_IDS.adopta, SECTION_IDS.mercado, SECTION_IDS.negocios],
  },
  {
    titulo: 'Tienda y comunidad',
    sectionIds: [SECTION_IDS.tienda, SECTION_IDS.comunidad],
  },
] as const satisfies readonly FooterGroup[];

/** Barra inferior: copyright con año estático (sin fechas en runtime). */
export const FOOTER_COPYRIGHT =
  '© 2026 Origen Tostado · Monacua Global Company S.A.S. · Armenia, Quindío';

/** Cierre editorial del footer. */
export const FOOTER_CIERRE = 'Donde el café se escucha';

/** Puntos de color de la paleta del cierre (ámbar, coral, teal, púrpura). */
export const FOOTER_PALETA = [
  'var(--amber)',
  'var(--coral)',
  'var(--teal-bright)',
  'var(--purple-soft)',
] as const;

/** Valida que un href del footer sea un hash interno permitido. */
export function esHashInterno(href: string): href is FooterHash {
  return (FOOTER_ALLOWED_HASHES as readonly string[]).includes(href);
}
