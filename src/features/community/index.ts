/**
 * Feature: community
 * ---------------------------------------------------------------------
 * Foro, reacciones y captura de leads de comunidad.
 *
 * Regla del plan: el contenido de usuarios se almacena como texto o se
 * sanitiza (prevención de XSS). Un único like por usuario y post,
 * operación idempotente. Los datos reales viven en Supabase; aquí está
 * el contrato y la lógica pura.
 */

export type ForumCategory = 'Café' | 'Música' | 'Arte';

export interface ForumPost {
  id: string;
  author: string;
  authorAvatar?: string;
  category: ForumCategory;
  title: string;
  body: string;
  likes: number;
  likedByMe?: boolean;
  mine?: boolean;
  createdAt: string;
}

export interface NewsletterLead {
  email: string;
  source?: string;
  createdAt: string;
}

/** Contenido estático del CTA público de comunidad (sección 10). */
export interface ComunidadCTA {
  /** Encabezado numerado de la sección. */
  encabezado: string;
  /** Mensaje principal («No solo lo escuchas. Lo vives.»). */
  mensaje: string;
  /** Texto de pertenencia (frecuencias privadas, drops, rituales, Casa Cántara). */
  texto: string;
  /** Placeholder del campo de correo. */
  placeholderCorreo: string;
  /** Etiqueta del botón del formulario. */
  cta: string;
  /** Cierre editorial. */
  cierre: string;
  /** Etiqueta del enlace de regreso a la escucha. */
  volver: string;
  /** Aviso visible: el correo no se envía ni se guarda. */
  aviso: string;
}

/** Contenido del CTA público de comunidad (datos del mockup, sin foro). */
export const COMUNIDAD_CTA: ComunidadCTA = {
  encabezado: '10 / COMUNIDAD',
  mensaje: 'No solo lo escuchas. Lo vives.',
  texto:
    'Esto no termina en una compra: empieza en una pertenencia. Frecuencias privadas, drops de árboles, acceso anticipado a rituales y, pronto, las puertas de Casa Cántara. El origen se cuida entre muchos.',
  placeholderCorreo: 'tu@correo.com',
  cta: 'Unirme',
  cierre: 'El café también se escucha.',
  volver: 'Volver a la escucha',
  aviso: 'Tu correo no se envía ni se guarda en esta demostración.',
};

/**
 * Mensaje aria-live genérico del CTA público tras un correo válido: la
 * comunidad se habilitará cuando el cliente confirme el flujo y el
 * tratamiento de datos. Sin parámetros: no conserva ni repite el correo
 * ingresado, y no menciona canales externos, CRM ni analytics.
 */
export function comunidadMensaje(): string {
  return 'Gracias por unirte. La comunidad se habilitará cuando el cliente confirme el flujo y el tratamiento de datos.';
}

/** Posts de ejemplo (datos del mockup). */
export const SEED_POSTS: ForumPost[] = [
  {
    id: 'p1',
    author: 'Tueste',
    category: 'Café',
    title: 'Por qué la tostión suena',
    body: 'El primer crack del grano es un instrumento de percusión: cada varietal truena distinto. Grabamos la tostión del Lote 000 y esa textura vive en «Coherencia 432 Hz». Escúchenla con audífonos.',
    likes: 14,
    createdAt: '2026-07-01',
  },
  {
    id: 'p2',
    author: 'Tueste',
    category: 'Música',
    title: 'Organic house desde el territorio',
    body: 'Una lista de referentes que caminan nuestra misma dirección: paisajes de campo convertidos en pista de baile lenta. ¿Qué agregarían ustedes?',
    likes: 9,
    createdAt: '2026-07-05',
  },
  {
    id: 'p3',
    author: 'Tueste',
    category: 'Arte',
    title: 'La arquitectura de Casa Cántara',
    body: 'Bocetos de cómo el sonido va a moldear los espacios: paredes que absorben, patios que amplifican. El café como sala de conciertos.',
    likes: 21,
    createdAt: '2026-07-10',
  },
];

/** Alterna el like de un post (idempotente por usuario). */
export function toggleLike(posts: ForumPost[], postId: string): ForumPost[] {
  return posts.map((p) => {
    if (p.id !== postId) return p;
    const liked = !p.likedByMe;
    return { ...p, likedByMe: liked, likes: p.likes + (liked ? 1 : -1) };
  });
}
