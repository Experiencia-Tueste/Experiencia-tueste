/**
 * Datos del dashboard de Tueste Tree — Drop, avance y secciones.
 *
 * Todo es estático y determinista: las cifras son REFERENCIA EDITORIAL
 * (sin transacciones, sin oferta pública, sin datos dinámicos).
 */

/** Estado demostrativo del Drop 000 (cifras fijas del mockup). */
export const DROP_STATUS = {
  nombre: 'Drop 000',
  lote: 'Lote 000 Founders',
  arboles: 10200,
  arbolesFundacionales: 10200,
  // Avance visual estático y determinista: barra fija de referencia.
  avance: 38,
  etiquetaAvance: 'Avance demostrativo',
  nota: 'Cifras de muestra: no reflejan el estado real de las adopciones.',
} as const;

/** Certificado / memoria: texto editorial del mockup. */
export const CERTIFICADO = {
  kicker: 'CERTIFICADO · MEMORIA',
  titulo: 'El certificado se emite en las primeras 48 horas.',
  texto:
    'Numerado, con tu nombre y el identificador de tu árbol y tu lote. Ponle nombre a tu árbol y verás el documento tomar forma.',
} as const;

/** El proyecto: lote, modelo, retorno y promesa (copy del mockup). */
export const PROYECTO = {
  lote: {
    kicker: 'EL LOTE',
    titulo: 'Lote 000 Founders',
    texto:
      'Café de altura del Paisaje Cultural Cafetero, en la región de Aures, Quindío. La presencia aquí es editorial y aproximada.',
  },
  modelo: {
    kicker: 'EL MODELO',
    titulo: 'Una adopción, no una inversión',
    texto:
      'Compras por adelantado el café de la primera cosecha y vives la experiencia de adoptar tu árbol. No genera rendimientos ni se revende.',
  },
  retorno: {
    kicker: 'LO QUE RECIBES',
    titulo: '2 bolsas de café por árbol',
    texto:
      'Con la primera cosecha recibes 2 bolsas de café de especialidad de 340 g por cada árbol. No es necesariamente el café de tu árbol exacto: se reúne y selecciona la cosecha del lote.',
  },
  promesa: {
    kicker: 'LA PROMESA',
    titulo: 'Prometemos menos. Cumplimos siempre.',
    texto:
      'Cada drop es una tanda de árboles con su propia frecuencia, su historia y su café: escasez real, como la de un microlote.',
  },
  territorio: {
    kicker: 'TERRITORIO',
    titulo: 'El origen se cuida también al nombrarlo',
    texto:
      'Finca Tres Esquinas vive en el Eje Cafetero. Su presencia aquí es editorial y aproximada: no publicamos coordenadas, linderos ni datos sensibles.',
  },
} as const;

/** Comunidad y ayuda. */
export const COMUNIDAD = {
  santuario: {
    kicker: 'COMUNIDAD',
    titulo: 'Un santuario para el origen',
    texto:
      'Parte de los fondos de cada adopción ayuda a levantar el futuro santuario de café, música y escucha. La comunidad participa de esa construcción.',
  },
  acompanamiento: {
    kicker: 'ACOMPAÑAMIENTO',
    titulo: 'Contacto y acompañamiento',
    texto:
      'La compra, el certificado y las condiciones de tu adopción se gestionan en la tienda Tueste Co.',
  },
} as const;

/* ── Datos literales del dashboard de José ── */

/**
 * Conteo de adopciones. Son las mismas cifras que publica la tienda
 * Tueste Co (ajuste `founders` de su tema: adoptados, total y primera
 * tanda). Allá se actualizan a mano, así que aquí también: al cambiarlas
 * en la tienda hay que cambiarlas en este objeto. Tomadas el 2026-11-14.
 */
export const FUNDADORES = {
  adoptados: 3710,
  total: 10200,
  tanda: 5200,
  fuente: 'Cifras publicadas en tueste.co al 14 de noviembre de 2026.',
  texto: 'fundadores ya acompañan el Lote 000.',
} as const;

export const MI_ARBOL_DEMO = {
  altitud: '1.840 m · Quindío',
  variedad: 'Var. Castillo · sombra 32%',
} as const;

export const CULTIVO_TERRAZA = 'Terraza 1–4 · Finca Tres Esquinas · Paisaje Cultural Cafetero';

/** Lotes / drops (02 · El lote). */
export const LOTES = [
  {
    code: 'DROP 001',
    name: 'Terraza 1',
    text: 'Los primeros soles del lote fundacional.',
    meta: 'Liberado',
  },
  {
    code: 'DROP 002',
    name: 'Terraza 2',
    text: 'Soles de la segunda tanda, con su propia frecuencia.',
    meta: 'En curso',
  },
  {
    code: 'DROP 003',
    name: 'Terraza 3',
    text: 'La siguiente cosecha de árboles por liberar.',
    meta: 'Próximo',
  },
  {
    code: 'DROP 004',
    name: 'Terraza 4',
    text: 'La tanda final de la ventana fundacional.',
    meta: 'Próximo',
  },
] as const;

/** La adopción (03): lo que incluye, según la ficha de la tienda. */
export const MODELO_KPIS = [
  { valor: '2', label: 'Bolsas de café por árbol' },
  { valor: '340 g', label: 'Por bolsa' },
  { valor: '48 h', label: 'Certificado numerado' },
  { valor: '4', label: 'Insignias' },
] as const;

/** Ecosistema (04): los cuatro motores del mockup. */
export const ECOSISTEMA_MOTORES = [
  { n: '01', name: 'Café', text: 'El lote del origen: recolección, tueste y catas.' },
  { n: '02', name: 'Música', text: 'Frecuencias grabadas en el territorio.' },
  { n: '03', name: 'Luz', text: 'El santuario de escucha y laboratorio de microlotes.' },
  {
    n: '04',
    name: 'Sonido',
    text: 'Una conexión con el origen que no existe en ningún otro café.',
  },
] as const;

/** Promesa (05): línea de tiempo editorial y voces. */
export const PROMESA_TIMELINE = [
  { when: '48 h', title: 'Certificado', text: 'El certificado se emite en las primeras 48 horas.' },
  {
    when: 'Cosecha',
    title: 'Café del lote',
    text: '2 bolsas de 340 g por árbol, de la selección del lote.',
  },
  { when: 'Siempre', title: 'Memoria', text: 'El ciclo documentado en tu bitácora editorial.' },
] as const;

export const VOCES = [
  { n: '01', name: 'El cultivo', text: 'Cada sol es un árbol real del Lote 000.' },
  { n: '02', name: 'La comunidad', text: 'Cada persona que adopta es Guardián de su árbol.' },
  { n: '03', name: 'El santuario', text: 'Un lugar en construcción, no una promesa terminada.' },
  { n: '04', name: 'El mundo', text: 'Círculos que crecen desde la finca hacia el mundo.' },
] as const;

export interface FaqItem {
  pregunta: string;
  respuesta: string;
}

/** Preguntas frecuentes, alineadas con la ficha de la tienda. */
export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    pregunta: '¿Es una inversión?',
    respuesta:
      'No. Compras por adelantado el café de la primera cosecha y vives la experiencia de adoptar tu árbol. No genera rendimientos ni se revende, y «Guardián» es un título simbólico: no compras el árbol, la tierra ni la finca.',
  },
  {
    pregunta: '¿Qué recibo y cuándo?',
    respuesta:
      'En 48 horas, el certificado numerado. En el primer mes, la primera foto o video de tu lote. Con la primera cosecha, 2 bolsas de café de 340 g por cada árbol.',
  },
  {
    pregunta: '¿El café es de mi árbol exacto?',
    respuesta:
      'No necesariamente. Un cafeto joven da poco en su primera cosecha, así que se reúne y selecciona la cosecha del lote. Tus 2 bolsas por árbol no cambian.',
  },
  {
    pregunta: '¿Dónde se compra la adopción?',
    respuesta:
      'En la tienda Tueste Co, con el pago seguro de Shopify. Allí están el precio vigente y las condiciones completas.',
  },
];
