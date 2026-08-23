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
  nota: 'Cifras de referencia editorial, no una oferta pública ni un estado real de ventas.',
} as const;

/** Certificado / memoria: texto editorial del mockup. */
export const CERTIFICADO = {
  kicker: 'CERTIFICADO · MEMORIA',
  titulo: 'El certificado se emite en las primeras 48 horas.',
  texto:
    'Numerado, con el identificador de tu árbol, tu lote y tu participación. Ponle nombre a tu árbol y verás el documento tomar forma.',
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
    titulo: 'Una etapa única de consolidación',
    texto:
      'No una oferta permanente: después, cada nuevo árbol será solo de adopción. Quienes entran ahora no adoptan: cofundan.',
  },
  retorno: {
    kicker: 'RETORNO · PARTICIPACIÓN',
    titulo: 'Participación de referencia',
    texto:
      'No prometemos el café de un árbol exacto, sino el café del lote donde vive tu árbol —o un beneficio equivalente—. Cifras orientativas, sujetas a estructuración legal.',
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
      'El acompañamiento del adoptante se habilitará junto con el marco legal y operativo. Por ahora, todo es exploración editorial.',
  },
} as const;

/* ── Datos literales del dashboard de José ── */

export const FUNDADORES = {
  acompanan: 64,
  total: 10200,
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

/** Modelo fundacional (03): KPIs literales del mockup. */
export const MODELO_KPIS = [
  { valor: '10.200', label: 'Árboles fundacionales' },
  { valor: 'USD 100', label: 'Desde' },
  { valor: 'USD 1,02M', label: 'Capital objetivo' },
  { valor: '30%', label: 'Participación del proyecto' },
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
    text: 'El café del lote donde vive tu árbol —o un beneficio equivalente—.',
  },
  { when: 'Siempre', title: 'Memoria', text: 'El ciclo documentado en tu bitácora editorial.' },
] as const;

export const VOCES = [
  { n: '01', name: 'El cultivo', text: 'Cada sol es un árbol real del Lote 000.' },
  { n: '02', name: 'La comunidad', text: 'Quienes entran ahora no adoptan: cofundan.' },
  { n: '03', name: 'El santuario', text: 'Un lugar en construcción, no una promesa terminada.' },
  { n: '04', name: 'El mundo', text: 'Círculos que crecen desde la finca hacia el mundo.' },
] as const;

export interface FaqItem {
  pregunta: string;
  respuesta: string;
}

/** Preguntas frecuentes (contenido editorial, sin promesas técnicas). */
export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    pregunta: '¿Qué significa cofundar?',
    respuesta:
      'Los primeros 10.200 árboles son fundacionales: quienes entran ahora no adoptan, cofundan. Cada nivel define cuánto se acompaña el origen.',
  },
  {
    pregunta: '¿Cuándo se habilita el proceso formal?',
    respuesta:
      'El proceso formal de adopción se habilitará cuando el marco legal y operativo esté listo. Hoy la selección es una intención, sin pago ni compromiso.',
  },
  {
    pregunta: '¿Qué recibiré?',
    respuesta:
      'El café del lote donde vive tu árbol —o un beneficio equivalente—, la memoria del ciclo y el certificado de tu vínculo. Todo sujeto a estructuración legal.',
  },
  {
    pregunta: '¿Esto es una inversión?',
    respuesta:
      'No. Es una conexión cultural con el origen. Las cifras de participación son referencia editorial y no constituyen oferta pública ni contrato.',
  },
];
