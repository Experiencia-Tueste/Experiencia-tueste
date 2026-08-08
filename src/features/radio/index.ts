/**
 * Feature: radio
 * ---------------------------------------------------------------------
 * RADIO ORIGEN · Planes B2B por suscripción (sección #radio).
 * Datos estáticos tipados de los tres planes del mockup, sin duplicar
 * catálogo: la demostración «Señal Café» reutiliza RADIO_CHANNELS y
 * getChannel de features/audio. Sin códigos, fechas dinámicas ni
 * aleatoriedad; el registro, la operación y los pagos se habilitan solo
 * cuando el cliente confirme el flujo.
 */

export type RadioPlanId = 'senal' | 'disenada' | 'personalizada';

/** Acento de marca de cada plan (teal / ámbar / coral). */
export type RadioPlanAccent = 'teal' | 'amber' | 'coral';

export interface RadioPlan {
  id: RadioPlanId;
  nombre: string;
  /** Etiqueta corta bajo el nombre (del mockup). */
  tag: string;
  /** Precio mensual en USD (solo referencia visual). */
  priceUsd: number;
  accent: RadioPlanAccent;
  /** True solo para el plan destacado «Más elegido». */
  destacado?: boolean;
  features: readonly string[];
}

/** Los tres planes B2B de Radio Origen (datos del mockup). */
export const RADIO_PLANS: readonly RadioPlan[] = [
  {
    id: 'senal',
    nombre: 'Señal Origen',
    tag: 'La señal predeterminada',
    priceUsd: 10,
    accent: 'teal',
    features: [
      'Música original de Origen Tostado, sin líos de derechos de autor',
      'La señal predeterminada de la casa: suena igual y en continuo, lista al instante',
      'Licencia comercial para un espacio',
      'Suena en cualquier dispositivo o parlante',
    ],
  },
  {
    id: 'disenada',
    nombre: 'Diseñada por Tueste',
    tag: 'Según tu tipo de negocio',
    priceUsd: 20,
    accent: 'amber',
    destacado: true,
    features: [
      'Todo lo del plan Señal Origen',
      'Tueste diseña tu señal según el tipo de negocio: café, hotel, restaurante o tienda',
      'Programación por momentos del día, hecha por nuestro equipo',
      'Ajustes de temporada incluidos',
    ],
  },
  {
    id: 'personalizada',
    nombre: 'Totalmente Personalizada',
    tag: 'Tu canal propio',
    priceUsd: 30,
    accent: 'coral',
    features: [
      'Todo lo del plan Diseñada por Tueste',
      'Señal 100% personalizada para tu negocio y el concepto de tu marca',
      'Sesión de dirección sonora y piezas a medida del catálogo',
      'Ajustes mensuales contigo, a medida que tu marca evoluciona',
    ],
  },
];

/**
 * Mensaje aria-live de suscripción: el registro, la operación y los
 * pagos se habilitarán cuando el cliente confirme el flujo. Sin
 * WhatsApp, enlaces externos ni canales de contacto.
 */
export const suscripcionMensaje = (plan: RadioPlan): string =>
  `Suscripción a «${plan.nombre}» (USD ${plan.priceUsd}/mes): el registro, la operación y los pagos se habilitarán cuando el cliente confirme el flujo.`;
