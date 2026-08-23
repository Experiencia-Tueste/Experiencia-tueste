/**
 * Contenido editorial de Tueste Tree (dashboard + flujo de adopción).
 *
 * Textos literales del mockup aprobado de José (Tueste Tree
 * Dashboard.dc.html y Tueste Tree Adopcion.dc.html), bilingües
 * ES/EN donde el mockup los presenta así. Todo es determinista: sin
 * aleatoriedad, fechas dinámicas ni datos del navegador.
 */

/** Navegación de la sidebar (patrón del mockup de José). */
export const SIDEBAR_GROUPS = [
  {
    label: 'Tu adopción',
    items: [
      { id: 'mi-arbol', label: 'Mi árbol', href: '/tueste-tree#mi-arbol', tone: 'amber' },
      { id: 'cultivo', label: 'El cultivo', href: '/tueste-tree#cultivo-dash', tone: 'lime' },
      {
        id: 'certificado',
        label: 'Tu certificado',
        href: '/tueste-tree#cert-dash-titulo',
        tone: 'cream',
      },
    ],
  },
  {
    label: 'El proyecto',
    items: [
      { id: 'lotes', label: 'Los lotes', href: '/tueste-tree#lotes', tone: 'amber' },
      { id: 'modelo', label: 'El modelo', href: '/tueste-tree#modelo-dash-titulo', tone: 'teal' },
      {
        id: 'retorno',
        label: 'El retorno',
        href: '/tueste-tree#modelo-dash-titulo',
        tone: 'coral',
      },
      {
        id: 'promesa',
        label: 'La promesa',
        href: '/tueste-tree#promesa-dash-titulo',
        tone: 'coral',
      },
      {
        id: 'territorio',
        label: 'El territorio',
        href: '/tueste-tree#terr-dash-titulo',
        tone: 'teal',
      },
    ],
  },
  {
    label: 'Comunidad',
    items: [
      { id: 'comunidad', label: 'Comunidad', href: '/tueste-tree#com-dash-titulo', tone: 'coral' },
      { id: 'inquietudes', label: 'Inquietudes', href: '/tueste-tree#inquietudes', tone: 'teal' },
      {
        id: 'ecosistema',
        label: 'El ecosistema',
        href: '/tueste-tree#ecosistema-dash-titulo',
        tone: 'lilac',
      },
    ],
  },
] as const;

/* ── Dashboard · panel de adopción ── */

export const DASHBOARD_KICKER = 'TUESTE TREE · PANEL DE ADOPCIÓN';
export const DASHBOARD_TITLE = 'Panel de adopción';
export const DASHBOARD_TITLE_EN = 'Adoption dashboard';
export const FOUNDING_WINDOW =
  'Ventana fundacional abierta · los primeros 10.200 árboles cofundan el origen.';
export const SUN_MEANING = 'Cada sol es un árbol real del Lote 000.';
export const CERT_48H = 'El certificado se emite en las primeras 48 horas.';
export const DROPS = 'La adopción se abre por drops, como una cosecha.';
export const FIRST_TREES = 'Los primeros 10.200 árboles.';
export const SIX_LEVELS = 'Seis niveles para cofundar.';
export const COFOUND_NOTE = 'Quienes entran ahora no adoptan: cofundan.';
export const FOUR_ENGINES = 'Cuatro motores que se alimentan entre sí.';
export const PROMISE = 'Prometemos menos. Cumplimos siempre.';
export const ORIGIN_LINK = 'Una conexión con el origen que no existe en ningún otro café.';

/** Avance de secciones del dashboard (construidas en fases posteriores). */
export const DASHBOARD_SECTIONS = [
  { id: 'mi-arbol', num: '01', label: 'Mi árbol' },
  { id: 'certificado', num: '02', label: 'Certificado' },
  { id: 'cultivo', num: '03', label: 'El cultivo' },
  { id: 'lotes', num: '04', label: 'Lotes y drops' },
  { id: 'niveles', num: '05', label: 'Niveles fundacionales' },
  { id: 'modelo', num: '06', label: 'El modelo fundacional' },
  { id: 'promesa', num: '07', label: 'La promesa' },
  { id: 'retorno', num: '08', label: 'Retorno' },
  { id: 'territorio', num: '09', label: 'Territorio' },
  { id: 'ecosistema', num: '10', label: 'Ecosistema' },
  { id: 'comunidad', num: '11', label: 'Comunidad' },
  { id: 'inquietudes', num: '12', label: 'Inquietudes' },
] as const;

/* ── Adopción · flujo de cofundación ── */

export const ADOPT_KICKER = 'TUESTE TREE · ADOPCIÓN';
export const ADOPT_TITLE = 'Adopta un árbol. Cofunda un origen.';
export const ADOPT_LEAD =
  'El café también se escucha. Aquí eliges un árbol real en la Finca Tres Esquinas, le pones nombre y sigues su ciclo hasta la taza.';
export const ADOPT_NOT_CHECKOUT = 'No es un checkout. Es entrar a una historia.';
export const ADOPT_CONNECT = 'No compras solo café. Conectas con su origen.';
export const ADOPT_RITUAL = 'Adopta tu árbol. Recibe tu café. Vive la historia.';

export const VINCULO_KICKER = '01 / ELIGE TU VÍNCULO';
export const VINCULO_TITLE = 'Elige tu vínculo';
export const CULTIVO_INTRO = 'Todo empieza eligiendo un punto en el cultivo.';
export const CULTIVO_PUNTOS =
  'Cada punto es un árbol del Lote 000 Founders. Toca uno libre para empezar el ritual de adopción.';
export const RITUAL_KICKER = '02 / RITUAL DE ADOPCIÓN';
export const MODELO_KICKER = '03 / EL MODELO FUNDACIONAL';
export const ECOSISTEMA_KICKER = '04 / EL ECOSISTEMA';
export const ECOSISTEMA_TEXT =
  'Café, música, luz y sonido. Recolección, tueste, catas y conexión directa con el cultivo.';
export const SANTUARIO_TEXT =
  'El futuro santuario en la Finca Tres Esquinas: catas sonoras, laboratorio de microlotes y residencias.';
export const FRECUENCIA_TEXT =
  'Cada lote tiene su frecuencia, construida con grabaciones reales del territorio: agua, viento, cerezas, tostión.';

/* ── Drop 000 y estado inicial ── */

export const DROP_000_KICKER = 'DROP 000 · FUNDACIONAL';
export const DROP_000_TITLE = 'Drop 000';
export const DROP_000_LEAD =
  'Nada se libera de golpe. Cada drop es una tanda de árboles con su propia frecuencia, su historia y su café: escasez real, como la de un microlote.';
export const DROP_000_EMPTY =
  'Aún no hay adopciones en esta cuenta. El primer paso es elegir un árbol en el Drop 000.';
export const DROP_000_CTA = 'Adoptar / Cofundar un árbol';

/* ── Sección de cultivo (adopción) ── */

export const CULTIVO_SECTION_TITLE = 'Elige el árbol que vas a acompañar.';
export const CULTIVO_SECTION_TITLE_EN = 'Choose the tree you will accompany.';
export const CULTIVO_DEMO_NOTE =
  'Cuadrícula demostrativa: los estados son de muestra y la selección vive solo en esta sesión. Sin reserva, pago ni compromiso real.';

/* ── Dashboard · Mi árbol ── */

export const MY_TREE_EYEBROW = '01 · MI ÁRBOL';
export const MY_TREE_TITLE = 'Todo empieza eligiendo un árbol.';
export const MY_TREE_TEXT =
  'Cuando elijas tu árbol, aquí verás su número, su lote y el ciclo que acompaña. Por ahora, el primer paso es elegir el punto del cultivo que vas a acompañar.';
export const MY_TREE_FINCA = 'Finca Tres Esquinas';
export const MY_TREE_QUINDIO = 'Quindío';
export const MY_TREE_LOTE = 'Lote 000 Founders';
export const MY_TREE_CTA = 'Elegir mi árbol';

/* ── Dashboard · El cultivo ── */

export const CULTIVO_EYEBROW = '02 · EL CULTIVO';
export const CULTIVO_TITLE = 'Cada sol es un árbol real del Lote 000.';
export const CULTIVO_LEAD = 'Explora el Lote 000 Founders y elige el árbol que quieres acompañar.';
export const LEGEND_AVAILABLE = 'Disponible.';
export const LEGEND_ADOPTED = 'Adoptado.';
export const LEGEND_YOURS = 'Tu árbol.';
export const LEGEND_YOURS_EMPTY = 'Aún no has elegido uno.';

/* ── Ritual de adopción ── */

export const DROP_OPEN_EYEBROW = 'DROP ABIERTO · 10.200 ÁRBOLES';
export const RITUAL_STEPS = [
  { num: '01', titulo: 'Elegir árbol' },
  { num: '02', titulo: 'Nombrarlo' },
  { num: '03', titulo: 'Elegir nivel' },
  { num: '04', titulo: 'Certificado y bitácora' },
] as const;
export const RITUAL_TREE_INTRO = 'Todo comienza seleccionando un punto en el cultivo.';
export const RITUAL_NAME_LABEL = 'Ponle nombre a tu árbol';
export const RITUAL_NAME_HINT = 'El nombre viaja contigo en la memoria del lote.';
export const RITUAL_LEVEL_LABEL = 'Elige tu nivel de cofundación';
export const RITUAL_LEVEL_HINT =
  'Cifras informativas y sujetas a estructuración legal: no implican pago inmediato.';
export const RITUAL_CONFIRM =
  'Tu selección es una intención de adopción. El proceso formal se habilitará cuando el marco legal y operativo esté listo.';

/** Tres métricas editoriales del hero de adopción (referencia). */
export const HERO_METRICS = [
  { label: 'Árboles fundacionales', valor: '10.200' },
  { label: 'Desde', valor: 'USD 100' },
  { label: 'Territorio', valor: '1.840 m' },
] as const;

/* ── Aviso legal amplio ── */

export const LEGAL_AMPLIO =
  'Tueste Tree · un proyecto de Monacua Global Company S.A.S. Contenido informativo y demostrativo: las cifras de cofundación, niveles y participación son referencia editorial y no constituyen oferta pública, inversión ejecutable, contrato ni promesa contractual. Sin pagos ni compromisos reales hasta que el marco legal y operativo esté listo.';

/* ── Modelo fundacional y cierre ── */

export const MODELO_TITLE = 'Los primeros 10.200 árboles.';
export const MODELO_CAPITAL = 'USD 1.020.000';
export const MODELO_AVISO =
  'Cifras indicativas sujetas a estructuración legal. Este contenido es informativo y no constituye una oferta pública de valores.';

export const PROMESA = {
  titulo: 'Prometemos menos. Cumplimos siempre.',
  texto:
    'Cada drop es una tanda de árboles con su propia frecuencia, su historia y su café: escasez real, como la de un microlote.',
} as const;

export const COMUNIDAD_CIERRE = {
  titulo: 'Un santuario para el origen',
  texto:
    'Parte de los fondos de cada adopción ayuda a levantar el futuro santuario de café, música y escucha. La comunidad participa de esa construcción.',
} as const;

export const TERRITORIO_CIERRE = {
  titulo: 'El origen se cuida también al nombrarlo',
  texto:
    'Finca Tres Esquinas vive en el Eje Cafetero. Su presencia aquí es editorial y aproximada: sin coordenadas, linderos ni datos sensibles.',
} as const;

export const SIGUE_TEXT = {
  titulo: 'El ciclo sigue',
  texto:
    'Actualizaciones editoriales del cultivo, la cosecha y el proceso formal llegarán cuando el marco legal y operativo esté listo.',
} as const;

/* ── Aviso legal ── */

export const LEGAL_NOTE =
  'Tueste Tree · un proyecto de Monacua Global Company S.A.S. · Contenido informativo: no constituye oferta pública ni inversión garantizada.';
