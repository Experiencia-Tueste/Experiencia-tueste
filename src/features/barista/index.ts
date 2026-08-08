/**
 * Feature: barista
 * ---------------------------------------------------------------------
 * Motor de recomendaciones del Barista Sonoro de Origen Tostado.
 * Lógica pura (sin DOM): métodos de preparación, perfil sensorial,
 * intenciones y scoring. El chat y el temporizador guiado viven en la
 * capa de componentes.
 */

import type { TrackId } from '../../lib/audio';

export type Intencion =
  'arraigo' | 'calma' | 'enfoque' | 'energia' | 'creatividad' | 'introspeccion';
export type Sensorial = 'dulzor' | 'cuerpo' | 'aroma' | 'equilibrio';
export type Tiempo = 'rapido' | 'medio' | 'ritual';
export type Equipo = 'filtro' | 'aeropress' | 'prensa' | 'espresso' | 'ritual' | 'todos';

export interface PerfilSensorial {
  acidez: number;
  dulzor: number;
  cuerpo: number;
  aroma: number;
  amargor: number;
}

export interface BrewStep {
  name: string;
  description: string;
  /** Segundos del paso (null = paso manual sin temporizador). */
  seconds: number | null;
}

export interface BrewMethod {
  id: string;
  name: string;
  freq: number;
  estado: string;
  ratio: string;
  coffee: string;
  water: string;
  temp: string;
  grind: string;
  time: string;
  perfil: PerfilSensorial;
  /** Pista de audio asociada al método (ID del catálogo de audio). */
  trackId: TrackId;
  equipo: Equipo;
  origen: string;
  message: string;
  steps: BrewStep[];
}

export interface BaristaAnswers {
  intencion: Intencion;
  sensorial: Sensorial;
  tiempo: Tiempo;
  equipo: Equipo;
}

export interface Recommendation {
  method: BrewMethod;
  score: number;
  alternative: BrewMethod | null;
}

/** Paso del flujo de consulta del chat: pregunta + opciones tipadas. */
export interface ChatStep<K extends keyof BaristaAnswers = keyof BaristaAnswers> {
  key: K;
  question: string;
  options: ReadonlyArray<readonly [label: string, value: BaristaAnswers[K]]>;
}

/**
 * Flujo determinista de cuatro preguntas del Barista Sonoro (del mockup).
 * Cada paso guarda la clave de respuesta y sus opciones tipadas; el
 * componente de chat lo consume sin duplicar el algoritmo de
 * recomendación (recommend).
 */
export const CHAT_FLOW: ReadonlyArray<
  ChatStep<'intencion'> | ChatStep<'sensorial'> | ChatStep<'tiempo'> | ChatStep<'equipo'>
> = [
  {
    key: 'intencion',
    question:
      'Hola, soy tu barista de Origen Tostado. Te recomiendo una preparación de café con su frecuencia ritual y un mensaje para tu día. Primero: ¿con qué intención llegas?',
    options: [
      ['Arraigo · raíz', 'arraigo'],
      ['Calma · pausa', 'calma'],
      ['Enfoque', 'enfoque'],
      ['Energía', 'energia'],
      ['Creatividad', 'creatividad'],
      ['Introspección', 'introspeccion'],
    ],
  },
  {
    key: 'sensorial',
    question: '¿Qué quieres sentir en la taza?',
    options: [
      ['Dulzor y suavidad', 'dulzor'],
      ['Cuerpo e intensidad', 'cuerpo'],
      ['Aroma y brillo', 'aroma'],
      ['Equilibrio', 'equilibrio'],
    ],
  },
  {
    key: 'tiempo',
    question: '¿Cuánto tiempo tienes?',
    options: [
      ['Rápido', 'rapido'],
      ['Medio', 'medio'],
      ['Ritual, sin prisa', 'ritual'],
    ],
  },
  {
    key: 'equipo',
    question: '¿Con qué lo preparas?',
    options: [
      ['Filtro / V60', 'filtro'],
      ['AeroPress', 'aeropress'],
      ['Prensa francesa', 'prensa'],
      ['Espresso', 'espresso'],
      ['Ritual (sifón/chemex)', 'ritual'],
      ['El que recomiendes', 'todos'],
    ],
  },
];

/** Métodos de preparación (datos del mockup). */
export const METHODS: BrewMethod[] = [
  {
    id: 'v60',
    name: 'V60',
    freq: 128,
    estado: 'equilibrio',
    ratio: '1:15',
    coffee: '20 g',
    water: '300 ml',
    temp: '92 °C',
    grind: 'media-gruesa',
    time: '3:30',
    perfil: { acidez: 4, dulzor: 4, cuerpo: 2, aroma: 5, amargor: 2 },
    trackId: 'coherencia-432',
    equipo: 'filtro',
    origen: 'Aures 1840 · Huila',
    message: 'Hoy no necesitas correr para brillar; basta con servirte con precisión.',
    steps: [
      {
        name: 'Prepara',
        description:
          'Agua a 92 °C. Enjuaga el filtro, precalienta y agrega 20 g molienda media-gruesa.',
        seconds: null,
      },
      {
        name: 'Bloom',
        description: 'Vierte 60 ml en círculos suaves y deja florecer el café.',
        seconds: 45,
      },
      {
        name: 'Primer vertido',
        description: 'En espiral, del centro hacia afuera, sube hasta 180 ml.',
        seconds: 30,
      },
      {
        name: 'Segundo vertido',
        description: 'Completa hasta 300 ml, del borde al centro.',
        seconds: 30,
      },
      {
        name: 'Drenaje',
        description: 'Deja drenar hasta ver la cama de café plana.',
        seconds: 105,
      },
    ],
  },
  {
    id: 'chemex',
    name: 'Chemex',
    freq: 144,
    estado: 'claridad',
    ratio: '1:16',
    coffee: '30 g',
    water: '480 ml',
    temp: '94 °C',
    grind: 'media-gruesa',
    time: '4:00–5:00',
    perfil: { acidez: 4, dulzor: 4, cuerpo: 2, aroma: 4, amargor: 1 },
    trackId: 'expansion-432',
    equipo: 'ritual',
    origen: 'Nariño · taza floral',
    message: 'Cuando filtras el exceso, aparece lo esencial.',
    steps: [
      {
        name: 'Prepara',
        description: 'Agua a 94 °C. Enjuaga muy bien el filtro grueso; 30 g media-gruesa.',
        seconds: null,
      },
      { name: 'Bloom', description: '90 ml para abrir el café.', seconds: 45 },
      {
        name: 'Vertidos',
        description: 'En espiral y por tandas, hasta completar 480 ml.',
        seconds: 135,
      },
      { name: 'Drenaje', description: 'Deja caer la última fase sin apuro.', seconds: 90 },
    ],
  },
  {
    id: 'aeropress',
    name: 'AeroPress',
    freq: 222,
    estado: 'adaptabilidad',
    ratio: '1:13',
    coffee: '17 g',
    water: '220 ml',
    temp: '85 °C',
    grind: 'media-fina',
    time: '1:30–2:00',
    perfil: { acidez: 3, dulzor: 4, cuerpo: 3, aroma: 4, amargor: 2 },
    trackId: 'raiz-222',
    equipo: 'aeropress',
    origen: 'Aures 1840 · Huila',
    message: 'Incluso en días cortos, puedes preparar algo grande con método.',
    steps: [
      {
        name: 'Prepara',
        description: 'Agua a 85 °C. Filtro enjuagado; 17 g molienda media-fina.',
        seconds: null,
      },
      {
        name: 'Vierte y remueve',
        description: 'Los 220 ml de una vez; 10 segundos de giro suave.',
        seconds: 30,
      },
      { name: 'Reposo', description: 'Deja que la inmersión haga su trabajo.', seconds: 45 },
      {
        name: 'Presiona',
        description: 'Presión constante y suave hasta escuchar el siseo.',
        seconds: 25,
      },
    ],
  },
  {
    id: 'espresso',
    name: 'Espresso',
    freq: 256,
    estado: 'intensidad',
    ratio: '1:2',
    coffee: '18 g',
    water: '36 g en taza',
    temp: '93 °C',
    grind: 'fina',
    time: '25–30 s',
    perfil: { acidez: 3, dulzor: 3, cuerpo: 5, aroma: 5, amargor: 3 },
    trackId: 'despertar-528',
    equipo: 'espresso',
    origen: 'Santander · cuerpo',
    message: 'Que tu energía no sea prisa; que sea presencia concentrada.',
    steps: [
      {
        name: 'Prepara',
        description: '18 g molienda fina. Distribuye parejo y tampa nivelado.',
        seconds: null,
      },
      {
        name: 'Extracción',
        description: 'Corta al llegar a 36 g en taza. El flujo: miel continua.',
        seconds: 28,
      },
    ],
  },
  {
    id: 'prensa-francesa',
    name: 'Prensa Francesa',
    freq: 96,
    estado: 'calma',
    ratio: '1:15',
    coffee: '20 g',
    water: '300 ml',
    temp: '94 °C',
    grind: 'gruesa',
    time: '4:00',
    perfil: { acidez: 2, dulzor: 4, cuerpo: 5, aroma: 4, amargor: 3 },
    trackId: 'origen-111',
    equipo: 'prensa',
    origen: 'Sierra Nevada · dulzor',
    message: 'No todo lo profundo tiene que ser pesado; también puedes sostenerte con suavidad.',
    steps: [
      {
        name: 'Prepara',
        description: 'Agua a 94 °C y 20 g de molienda gruesa en la prensa.',
        seconds: null,
      },
      {
        name: 'Vierte y remueve',
        description: '300 ml y un giro suave para integrar.',
        seconds: 20,
      },
      {
        name: 'Reposo',
        description: 'Tapa sin presionar. La calma construye el cuerpo.',
        seconds: 220,
      },
      {
        name: 'Sirve',
        description: 'Rompe la costra, retira la espuma y presiona apenas.',
        seconds: null,
      },
    ],
  },
  {
    id: 'sifon',
    name: 'Sifón',
    freq: 432,
    estado: 'ceremonia',
    ratio: '1:12',
    coffee: '20 g',
    water: '240 ml',
    temp: '96 °C',
    grind: 'media',
    time: '1:00 de contacto',
    perfil: { acidez: 4, dulzor: 4, cuerpo: 3, aroma: 5, amargor: 2 },
    trackId: 'expansion-432',
    equipo: 'ritual',
    origen: 'Cauca · aromático',
    message: 'Convierte tu rutina en arte: lo extraordinario empieza cuando atiendes cada detalle.',
    steps: [
      {
        name: 'Prepara',
        description: 'Monta el sifón: 240 ml abajo, 20 g de molienda media listos.',
        seconds: null,
      },
      {
        name: 'Sube el agua',
        description: 'Cuando el agua suba, agrega el café y remueve 10 segundos.',
        seconds: null,
      },
      { name: 'Contacto', description: 'Infusión viva a 96 °C. Observa el baile.', seconds: 60 },
      {
        name: 'Desciende',
        description: 'Retira el calor y mira el descenso. Sirve despacio.',
        seconds: null,
      },
    ],
  },
  {
    id: 'tinto-olleta',
    name: 'Tinto de Olleta',
    freq: 64,
    estado: 'arraigo',
    ratio: '1:21',
    coffee: '7 g',
    water: '150 ml',
    temp: '96 °C',
    grind: 'gruesa',
    time: '6–7 min',
    perfil: { acidez: 2, dulzor: 3, cuerpo: 2, aroma: 3, amargor: 2 },
    trackId: 'origen-111',
    equipo: 'ritual',
    origen: 'Aures 1840 · tradición',
    message: 'Regresa a lo simple: a veces el alma solo necesita una taza honesta.',
    steps: [
      {
        name: 'Prepara',
        description: '150 ml de agua en la olleta; panela al gusto.',
        seconds: null,
      },
      {
        name: 'Hierve suave',
        description: 'Agrega 7 g gruesos. Fuego bajo, sin afán.',
        seconds: 390,
      },
      { name: 'Reposa y cuela', description: 'Un minuto de reposo; sirve colado.', seconds: 60 },
    ],
  },
];

/** Estado ritual por frecuencia (64 -> 'Arraigo', 432 -> 'Ceremonia'…). */
export const ESTADO_RITUAL: Record<number, string> = {
  64: 'Arraigo',
  96: 'Calma',
  128: 'Equilibrio',
  144: 'Claridad',
  180: 'Foco',
  222: 'Adaptabilidad',
  256: 'Intensidad',
  320: 'Creatividad',
  432: 'Ceremonia',
};

/** Perfil objetivo por preferencia sensorial. */
export const PREF: Record<Sensorial, PerfilSensorial> = {
  dulzor: { acidez: 2, dulzor: 5, cuerpo: 3, aroma: 3, amargor: 1 },
  cuerpo: { acidez: 2, dulzor: 3, cuerpo: 5, aroma: 3, amargor: 3 },
  aroma: { acidez: 4, dulzor: 3, cuerpo: 2, aroma: 5, amargor: 1 },
  equilibrio: { acidez: 3, dulzor: 4, cuerpo: 3, aroma: 4, amargor: 2 },
};

/** Ajuste de tiempo por método. */
export const TIEMPO_FIT: Record<Tiempo, Record<string, number>> = {
  rapido: {
    AeroPress: 1,
    Espresso: 0.9,
    V60: 0.6,
    Chemex: 0.4,
    'Prensa Francesa': 0.4,
    Sifón: 0.3,
    'Tinto de Olleta': 0.3,
  },
  medio: {
    V60: 1,
    Chemex: 0.9,
    AeroPress: 0.9,
    'Prensa Francesa': 0.8,
    Espresso: 0.7,
    Sifón: 0.6,
    'Tinto de Olleta': 0.6,
  },
  ritual: {
    Sifón: 1,
    Chemex: 0.9,
    'Tinto de Olleta': 0.9,
    'Prensa Francesa': 0.8,
    V60: 0.7,
    AeroPress: 0.5,
    Espresso: 0.5,
  },
};

/** Mapeo de intención a estado ritual. */
export const INTENCION: Record<Intencion, string> = {
  arraigo: 'arraigo',
  calma: 'calma',
  enfoque: 'equilibrio',
  energia: 'intensidad',
  creatividad: 'claridad',
  introspeccion: 'ceremonia',
};

/** Métodos permitidos por equipo. null = todos. */
export const EQUIPO: Record<Equipo, string[] | null> = {
  filtro: ['v60', 'chemex'],
  aeropress: ['aeropress'],
  prensa: ['prensa-francesa'],
  espresso: ['espresso'],
  ritual: ['sifon', 'tinto-olleta', 'chemex'],
  todos: null,
};

/** Similitud sensorial: 1 = perfil idéntico al objetivo. */
export function scoreSensorial(target: PerfilSensorial, perfil: PerfilSensorial): number {
  let diff = 0;
  for (const key of Object.keys(target) as Array<keyof PerfilSensorial>) {
    diff += Math.abs(target[key] - perfil[key]);
  }
  return 1 - diff / 25;
}

/**
 * Recomienda el mejor método según las respuestas del usuario.
 * Pesos (del mockup): 45% sensorial, 25% frecuencia, 20% estado, 10% tiempo.
 */
export function recommend(answers: BaristaAnswers): Recommendation {
  const estadoObj = INTENCION[answers.intencion];
  const target = PREF[answers.sensorial];
  const allow = EQUIPO[answers.equipo];

  let candidates = METHODS.filter((m) => !allow || allow.includes(m.id));
  if (candidates.length === 0) candidates = METHODS.slice();

  const ranked = candidates
    .map((method) => {
      const sSens = scoreSensorial(target, method.perfil);
      const sFreq = 0.7;
      const sEst = method.estado === estadoObj ? 1 : 0.6;
      const sTime = TIEMPO_FIT[answers.tiempo][method.name] ?? 0.6;
      const score = 0.45 * sSens + 0.25 * sFreq + 0.2 * sEst + 0.1 * sTime;
      return { method, score };
    })
    .sort((a, b) => b.score - a.score);

  return {
    method: ranked[0].method,
    score: ranked[0].score,
    alternative: ranked[1]?.method ?? null,
  };
}

/** Duración total de una preparación (suma de pasos con temporizador). */
export function brewTotalSeconds(method: BrewMethod): number {
  return method.steps.reduce((acc, s) => acc + (s.seconds ?? 0), 0);
}
