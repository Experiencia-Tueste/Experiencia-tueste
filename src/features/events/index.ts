/**
 * Feature: events
 * ---------------------------------------------------------------------
 * Agenda pública de Origen Tostado (sección #eventos / «En Vivo»).
 * Datos del mockup: cuatro eventos con fecha visible, tipo, ciudad,
 * lugar, hora opcional, precio opcional, estado explícito y CTA.
 * Lógica pura (sin DOM): estados, reservabilidad y mensajes accesibles.
 * Los estados son explícitos (few/open/wait/past), nunca calculados
 * según la fecha actual.
 */

export type EventStatus = 'few' | 'open' | 'wait' | 'past';
export type EventType = 'RITUAL' | 'LISTENING' | 'CLUB' | 'LANZAMIENTO';

export interface EventItem {
  id: string;
  /** Día visible de la fecha (ej. '21'). */
  day: string;
  /** Mes visible (ej. 'JUN'). */
  month: string;
  /** Año visible (ej. '2026'). */
  year: string;
  /** Fecha ISO para el atributo `dateTime` del elemento `<time>`. */
  dateTime: string;
  type: EventType;
  title: string;
  city: string;
  venue: string;
  /** Hora opcional (ej. '5:00 PM'); vacío si no aplica. */
  time: string;
  /** Precio opcional (ej. 'USD 100 · incluye árbol'); vacío si no aplica. */
  price: string;
  status: EventStatus;
  cta: string;
}

/**
 * Agenda del mockup (tueste.html, `const EVENTS`): cuatro eventos en
 * orden editorial. Solo `past` está cerrado; `few` señala últimos
 * cupos y `wait` lista de espera.
 */
export const EVENTS: readonly EventItem[] = [
  {
    id: 'ritual-adopcion-001',
    day: '21',
    month: 'JUN',
    year: '2026',
    dateTime: '2026-06-21',
    type: 'RITUAL',
    title: 'Origen Tostado · Ritual de Adopción 001',
    city: 'Armenia, Quindío',
    venue: 'Finca Tres Esquinas',
    time: '5:00 PM',
    price: 'USD 100 · incluye árbol',
    status: 'few',
    cta: 'Reservar cupo',
  },
  {
    id: 'cata-sonora',
    day: '12',
    month: 'JUL',
    year: '2026',
    dateTime: '2026-07-12',
    type: 'LISTENING',
    title: 'Cata Sonora · Sesión de escucha',
    city: 'Bogotá',
    venue: 'Espacio íntimo por confirmar',
    time: '7:00 PM',
    price: 'desde USD 50',
    status: 'open',
    cta: 'Entradas',
  },
  {
    id: 'live-set-afro-organic',
    day: '09',
    month: 'AGO',
    year: '2026',
    dateTime: '2026-08-09',
    type: 'CLUB',
    title: 'Origen Tostado (live set) · Afro-organic',
    city: 'Medellín',
    venue: 'Showcase nocturno',
    time: '10:00 PM',
    price: 'Por confirmar',
    status: 'wait',
    cta: 'Lista de espera',
  },
  {
    id: 'coffee-in-frequencies',
    day: '07',
    month: 'MAY',
    year: '2026',
    dateTime: '2026-05-07',
    type: 'LANZAMIENTO',
    title: 'Coffee in Frequencies · Listening de lanzamiento',
    city: 'Armenia',
    venue: 'Realizado',
    time: '',
    price: '',
    status: 'past',
    cta: 'Realizado',
  },
];

/** Estados con cupo abierto (o lista de espera): reservables. */
export const RESERVABLE: readonly EventStatus[] = ['few', 'open', 'wait'];

/** True si el evento aún puede reservarse (todo menos `past`). */
export const isReservable = (status: EventStatus): boolean => status !== 'past';

/**
 * Mensaje aria-live local de reserva (sin WhatsApp, pagos ni
 * formularios): la reserva se habilitará cuando el cliente confirme la
 * operación y el canal de contacto.
 */
export const reservaMensaje = (ev: EventItem): string =>
  `${ev.cta} para «${ev.title}»: la reserva se habilitará cuando el cliente confirme la operación y el canal de contacto.`;
