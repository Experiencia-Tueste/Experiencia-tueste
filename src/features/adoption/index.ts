/**
 * Feature: adoption
 * ---------------------------------------------------------------------
 * TUESTE TREE · Adopta un árbol (sección #tueste-tree).
 * Contenido estático y contratos tipados del lote fundador, beneficios,
 * precio, aviso legal y datos de demostración. Sin autenticación,
 * pagos, persistencia ni IDs aleatorios: el panel demo usa identificadores
 * estáticos claramente marcados como demostración. La adopción es
 * simbólica, cultural y comunitaria (nunca una adopción real).
 */

export interface Beneficio {
  id: string;
  /** Clave del icono SVG determinista (cert, fotos, frecuencia, cafe). */
  icono: 'cert' | 'fotos' | 'frecuencia' | 'cafe';
  titulo: string;
  descripcion: string;
}

export interface LoteFundador {
  nombre: string;
  coordenadas: string;
  ubicacion: string;
  altitud: string;
}

export interface DemoBitacora {
  cuando: string;
  titulo: string;
  nota: string;
  hecho: boolean;
}

/**
 * Datos del panel demostrativo. Identificadores estáticos y marcados
 * como demo: no existe ninguna adopción real detrás.
 */
export interface DemoAdopcion {
  esDemo: true;
  arbolId: string;
  certificado: string;
  lote: string;
  desde: string;
  progreso: number;
  estacion: string;
  salud: string;
  alturaEstimada: string;
  proximaFoto: string;
  ultimaActualizacion: string;
  bitacora: readonly DemoBitacora[];
}

/** Precio visible del lote fundador (solo referencia visual). */
export const PRECIO_ADOPCION: Readonly<{ valor: string; detalle: string }> = {
  valor: 'USD 100',
  detalle: 'Adopción fundadora · todo incluido',
};

export const LOTE_FUNDADOR: LoteFundador = {
  nombre: 'Lote 000 · Founders · Finca Tres Esquinas',
  coordenadas: "4°32'N 75°40'O",
  ubicacion: 'Quindío, Colombia',
  altitud: '1.480 msnm',
};

/**
 * Cuatro beneficios del lote fundador (del mockup), con su icono SVG
 * determinista correspondiente.
 */
export const BENEFICIOS: readonly Beneficio[] = [
  {
    id: 'certificado',
    icono: 'cert',
    titulo: 'Certificado y árbol numerado',
    descripcion:
      'ID de tu árbol y lote, certificado digital y bienvenida a la comunidad privada en 24–48 h.',
  },
  {
    id: 'fotos',
    icono: 'fotos',
    titulo: 'Fotos del cultivo todo el año',
    descripcion:
      'Tu panel se actualiza con imágenes del lote desde la finca: mes a mes, temporada a temporada.',
  },
  {
    id: 'frecuencia',
    icono: 'frecuencia',
    titulo: 'La frecuencia de tu lote',
    descripcion:
      'Una pieza sonora de Origen Tostado ligada a tu árbol, que cambia con cada temporada.',
  },
  {
    id: 'cafe',
    icono: 'cafe',
    titulo: 'Café del lote y visita a la finca',
    descripcion:
      'Acceso preferencial al café del lote en cosecha y la posibilidad de venir a vivir tu árbol en persona.',
  },
];

/**
 * Aviso legal completo de la adopción simbólica (del mockup).
 * Visible siempre, en la oferta y en el panel demo.
 */
export const AVISO_LEGAL =
  'La adopción es simbólica, cultural y comunitaria. No constituye propiedad sobre la tierra, el árbol o la producción, ni una inversión financiera; los beneficios de café son proyectados y están sujetos a cosecha, clima y disponibilidad. Operado por Monacua Global Company S.A.S.';

/** Aviso del panel demostrativo: más explícito sobre el carácter demo. */
export const AVISO_DEMO =
  'Panel demostrativo. La adopción es simbólica y cultural; no implica propiedad sobre tierra, árbol o producción, ni una inversión financiera. Beneficios de café proyectados, sujetos a cosecha y disponibilidad. · Tueste Tree · Monacua Global Company S.A.S.';

/**
 * Bitácora del panel demo (del mockup): cuatro entradas completas y dos
 * próximas. Todo ficticio y estático.
 */
export const BITACORA_DEMO: readonly DemoBitacora[] = [
  {
    cuando: '12 feb 2026',
    titulo: 'Bienvenida · tu árbol fue sembrado',
    nota: 'Certificado emitido y árbol numerado en el Lote 000 de Finca Tres Esquinas. Frecuencia de bienvenida desbloqueada.',
    hecho: true,
  },
  {
    cuando: '10 mar 2026',
    titulo: 'Mes 1 · primeros brotes',
    nota: 'Primera foto desde la finca. Lluvias suaves; el lote despierta tras la poda.',
    hecho: true,
  },
  {
    cuando: '28 abr 2026',
    titulo: 'Floración · la ladera huele a azahar',
    nota: 'Actualización trimestral. Las plantas florecieron blancas y llegó una nueva frecuencia de temporada.',
    hecho: true,
  },
  {
    cuando: '02 jun 2026',
    titulo: 'Cuajado · se forman las cerezas',
    nota: 'Las flores dieron paso a los primeros frutos verdes. Tu árbol va adelantado respecto al lote.',
    hecho: true,
  },
  {
    cuando: 'ago 2026',
    titulo: 'Cosecha temprana',
    nota: 'Acceso preferencial al café del lote: preventa para adoptantes.',
    hecho: false,
  },
  {
    cuando: 'feb 2027',
    titulo: 'Balance del año 1',
    nota: 'Resumen del lote, material visual e invitación a renovar tu adopción.',
    hecho: false,
  },
];

/**
 * Datos estáticos del panel demo. El certificado y el ID del árbol están
 * marcados como demostración y no corresponden a ninguna adopción real.
 */
export const DEMO_ADOPCION: DemoAdopcion = {
  esDemo: true,
  arbolId: 'TT-000-DEMO',
  certificado: 'OT-2026-DEMO',
  lote: 'Lote 000 · Founders',
  desde: '12 feb 2026',
  progreso: 62,
  estacion: 'Floración',
  salud: 'Óptima',
  alturaEstimada: '1.3 m',
  proximaFoto: 'ago 2026',
  ultimaActualizacion: 'hace 3 días',
  bitacora: BITACORA_DEMO,
};

/** Texto aria-live al enviar el formulario de activación (demo). */
export const MENSAJE_ACTIVACION =
  'La activación se habilitará cuando el cliente confirme el flujo, la operación y el tratamiento de datos.';
