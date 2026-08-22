/**
 * Contenido editorial de la experiencia «Adopta tu árbol» (/adopta).
 *
 * Todo es literal y determinista: sin aleatoriedad, sin fechas ni
 * datos de navegador, sin contenido dinámico. Los textos exactos y las
 * rutas de la biblioteca fotográfica local viven aquí; los componentes
 * y la página solo los ensamblan.
 */

export const HERO_KICKER = 'ADOPTA · FINCA TRES ESQUINAS';
export const HERO_TITLE = 'Un árbol también guarda memoria.';
export const HERO_PARAGRAPH =
  'Adoptar un árbol es acompañar un ciclo: tierra, lluvia, flor, cereza y una taza que conserva el origen.';
export const HERO_CTA = 'Conoce el ciclo';
export const HERO_CTA_HREF = '#ciclo';

export const HERO_IMAGE_SRC = '/images/adopta/adopta-hero-cafeto-joven-v1.webp';
export const HERO_IMAGE_ALT = 'Cafeto joven creciendo en una finca de montaña al amanecer';

export const INTRO_KICKER = '01 / ELIGE TU VÍNCULO';
export const INTRO_TITLE = 'Una forma de estar cerca del origen.';
export const INTRO_PARAGRAPH =
  'Cada vínculo es una manera simbólica de acompañar el tiempo del café. Esta propuesta aún no representa una adopción comercial activa.';

export interface AdoptionBond {
  id: string;
  index: string;
  name: string;
  text: string;
  imageSrc: string;
  imageAlt: string;
}

export const BONDS: readonly AdoptionBond[] = [
  {
    id: 'semilla',
    index: '01',
    name: 'Semilla',
    text: 'El comienzo: una intención puesta en la tierra.',
    imageSrc: '/images/adopta/vinculo-semilla-v1.webp',
    imageAlt: 'Semilla de café germinando en suelo húmedo',
  },
  {
    id: 'arbol-joven',
    index: '02',
    name: 'Árbol joven',
    text: 'Un ciclo que empieza a encontrar su propia sombra.',
    imageSrc: '/images/adopta/vinculo-arbol-joven-v1.webp',
    imageAlt: 'Cafeto joven cuidado por manos de una persona productora',
  },
  {
    id: 'arbol-guardian',
    index: '03',
    name: 'Árbol guardián',
    text: 'Una presencia que acompaña la memoria del lote.',
    imageSrc: '/images/adopta/vinculo-arbol-guardian-v1.webp',
    imageAlt: 'Cafeto adulto cargado de cerezas maduras en la montaña',
  },
];

export const CYCLE_KICKER = '02 / EL CICLO DEL ÁRBOL';
export const CYCLE_TITLE = 'Del silencio de la semilla a tu taza.';

export interface AdoptionStage {
  number: string;
  name: string;
  phrase: string;
  imageSrc: string;
  imageAlt: string;
}

export const STAGES: readonly AdoptionStage[] = [
  {
    number: '01',
    name: 'Germinación',
    phrase: 'La raíz encuentra su primer pulso.',
    imageSrc: '/images/adopta/ciclo-germinacion-v1.webp',
    imageAlt: 'Brote de café emergiendo de la semilla',
  },
  {
    number: '02',
    name: 'Floración',
    phrase: 'El cafetal abre su tiempo más frágil.',
    imageSrc: '/images/adopta/ciclo-floracion-v1.webp',
    imageAlt: 'Flores blancas abiertas en una rama de cafeto',
  },
  {
    number: '03',
    name: 'Cereza',
    phrase: 'El color anuncia un origen en maduración.',
    imageSrc: '/images/adopta/ciclo-cereza-v1.webp',
    imageAlt: 'Cerezas rojas maduras en una rama de café',
  },
  {
    number: '04',
    name: 'Cosecha',
    phrase: 'Las manos convierten espera en cuidado.',
    imageSrc: '/images/adopta/ciclo-cosecha-v1.webp',
    imageAlt: 'Recolección manual de cerezas maduras de café',
  },
  {
    number: '05',
    name: 'Tu taza',
    phrase: 'El ciclo llega a la escucha cotidiana.',
    imageSrc: '/images/adopta/ciclo-taza-v1.webp',
    imageAlt: 'Café servido junto a granos tostados y paisaje de montaña',
  },
];

export const TERRITORY_KICKER = '03 / TERRITORIO';
export const TERRITORY_TITLE = 'El origen se cuida también al nombrarlo.';
export const TERRITORY_TEXT =
  'Finca Tres Esquinas vive en el Eje Cafetero. Su presencia aquí es editorial y aproximada: no publicamos coordenadas, linderos ni datos sensibles.';
export const TERRITORY_LABEL = 'UBICACIÓN APROXIMADA · QUINDÍO, COLOMBIA';

export const COMPANION_KICKER = '04 / LO QUE ACOMPAÑA EL CICLO';
export const COMPANION_TITLE = 'Memorias para volver al origen.';
export const COMPANION_NOTE =
  'Estos elementos son parte de la propuesta editorial y quedan sujetos a definición conjunta con el cliente.';
export const COMPANION_TAG = 'PROPUESTA EDITORIAL';

export interface AdoptionMemory {
  id: string;
  index: string;
  name: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
}

export const MEMORIES: readonly AdoptionMemory[] = [
  {
    id: 'bitacora',
    index: '01',
    name: 'Bitácora del ciclo',
    description: 'Registros visuales y notas del crecimiento a lo largo del tiempo.',
    imageSrc: '/images/adopta/memoria-bitacora-v1.webp',
    imageAlt: 'Cuaderno de campo junto a hojas y cerezas de café',
  },
  {
    id: 'carta',
    index: '02',
    name: 'Carta del origen',
    description: 'Un mensaje editorial nacido en la finca para acompañar la memoria del árbol.',
    imageSrc: '/images/adopta/memoria-carta-v1.webp',
    imageAlt: 'Manos sosteniendo una carta junto a una rama de café',
  },
  {
    id: 'cafe',
    index: '03',
    name: 'Café del lote',
    description:
      'Una referencia de la cosecha vinculada al territorio, cuando el proyecto la defina.',
    imageSrc: '/images/adopta/memoria-cafe-v1.webp',
    imageAlt: 'Taza de café junto a cerezas y granos del origen',
  },
  {
    id: 'ritual',
    index: '04',
    name: 'Ritual de escucha',
    description: 'Una pieza sonora para volver al origen desde cualquier lugar.',
    imageSrc: '/images/adopta/memoria-ritual-v1.webp',
    imageAlt: 'Sendero entre cafetales de montaña durante la hora dorada',
  },
];

export const CLOSING_PHRASE = 'No adoptas un objeto: acompañas un ciclo.';
export const CLOSING_CTA = 'Volver al origen';
export const CLOSING_CTA_HREF = '#inicio';
export const CLOSING_NOTE = 'Mockup editorial · pendiente de validación con José.';
