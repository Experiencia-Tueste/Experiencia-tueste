import { z } from 'zod';

/**
 * Esquemas compartidos de validación (Zod).
 *
 * Regla del plan: los datos recibidos de formularios, URLs, archivos y
 * webhooks se validan con esquemas compartidos; no se confía en la
 * interfaz. Estos esquemas viven en `lib` para que los consuman tanto
 * el cliente como las rutas de servidor.
 */

/* ── Identidad ───────────────────────────────────────────────────────── */

export const emailSchema = z
  .string()
  .trim()
  .min(3, 'El correo es demasiado corto')
  .max(120, 'El correo es demasiado largo')
  .email('Escribe un correo válido');

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Escribe tu nombre')
  .max(60, 'El nombre es demasiado largo');

export const whatsappSchema = z
  .string()
  .trim()
  .regex(/^\+?\d{7,15}$/, 'WhatsApp inválido: usa formato +57 3xx xxx xxxx')
  .optional()
  .or(z.literal(''));

/** Registro de miembro (Fase 3 del plan). */
export const memberRegistrationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: whatsappSchema,
  photo: z.string().optional(),
  consents: z
    .object({
      terms: z.boolean().refine((v) => v === true, 'Debes aceptar los términos'),
      privacy: z.boolean().refine((v) => v === true, 'Debes aceptar la política de privacidad'),
      communications: z.boolean().optional(),
    })
    .refine(
      (c) => c.terms === true && c.privacy === true,
      'Debes aceptar los términos y la política de privacidad',
    ),
});

/* ── Comunidad ───────────────────────────────────────────────────────── */

export const forumPostSchema = z.object({
  title: z.string().trim().min(3, 'El título es muy corto').max(90),
  body: z.string().trim().min(10, 'El contenido es muy corto').max(600),
  category: z.enum(['Café', 'Música', 'Arte']),
});

export const newsletterLeadSchema = z.object({
  email: emailSchema,
  source: z.string().max(40).optional(),
});

/* ── Comercio (el pago real usa el contrato privado de payments) ────── */

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().int().min(1).max(99),
});

export const orderDraftSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'El pedido está vacío'),
  channel: z.enum(['whatsapp']).default('whatsapp'),
  note: z.string().max(280).optional(),
});

/* ── Barista ─────────────────────────────────────────────────────────── */

export const baristaQuerySchema = z.object({
  intencion: z.enum(['arraigo', 'calma', 'enfoque', 'energia', 'creatividad', 'introspeccion']),
  sensorial: z.enum(['dulzor', 'cuerpo', 'aroma', 'equilibrio']),
  tiempo: z.enum(['rapido', 'medio', 'ritual']),
  equipo: z.enum(['filtro', 'aeropress', 'prensa', 'espresso', 'ritual', 'todos']),
});

/* ── Tipos derivados ─────────────────────────────────────────────────── */

export type MemberRegistration = z.infer<typeof memberRegistrationSchema>;
export type ForumPost = z.infer<typeof forumPostSchema>;
export type NewsletterLead = z.infer<typeof newsletterLeadSchema>;
export type OrderDraft = z.infer<typeof orderDraftSchema>;
export type BaristaQuery = z.infer<typeof baristaQuerySchema>;
