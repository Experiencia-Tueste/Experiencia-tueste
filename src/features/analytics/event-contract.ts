import { z } from 'zod';

/** Versión del contrato de medición first-party; cambia solo con revisión. */
export const ANALYTICS_EVENT_VERSION = 1 as const;

export const ANALYTICS_EVENT_NAMES = [
  'cart_opened',
  'product_added',
  'checkout_started',
  'audio_started',
  'radio_demo_started',
  'event_request_submitted',
  'community_joined',
  'radio_request_submitted',
  'seller_application_submitted',
  'market_availability_requested',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

/** Diccionario versionado: propietario y propiedades permitidas por evento. */
export const ANALYTICS_EVENT_DICTIONARY = {
  cart_opened: { owner: 'commerce', properties: ['itemCount'] },
  product_added: { owner: 'commerce', properties: ['productId', 'quantity'] },
  checkout_started: { owner: 'commerce', properties: ['itemCount', 'mode'] },
  audio_started: { owner: 'experience', properties: ['trackId', 'source'] },
  radio_demo_started: { owner: 'radio', properties: ['channelId'] },
  event_request_submitted: { owner: 'events', properties: ['eventId'] },
  community_joined: { owner: 'community', properties: ['preferenceCount'] },
  radio_request_submitted: { owner: 'radio', properties: ['planId'] },
  seller_application_submitted: { owner: 'market', properties: [] },
  market_availability_requested: { owner: 'market', properties: ['listingId'] },
} as const satisfies Record<AnalyticsEventName, { owner: string; properties: readonly string[] }>;

const id = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9._:-]+$/);
const count = z.number().int().min(0).max(1000);
const itemCount = z.number().int().min(0).max(100);
const eventId = z.string().uuid();

const common = { eventVersion: z.literal(ANALYTICS_EVENT_VERSION), eventId };

/**
 * Contrato estricto de entrada. Los objetos son `.strict()` para que un
 * correo, teléfono, nombre o texto libre no pueda colarse como propiedad.
 */
export const analyticsEventSchema = z.discriminatedUnion('eventName', [
  z
    .object({
      ...common,
      eventName: z.literal('cart_opened'),
      properties: z.object({ itemCount }).strict(),
    })
    .strict(),
  z
    .object({
      ...common,
      eventName: z.literal('product_added'),
      properties: z.object({ productId: id, quantity: z.number().int().min(1).max(10) }).strict(),
    })
    .strict(),
  z
    .object({
      ...common,
      eventName: z.literal('checkout_started'),
      properties: z
        .object({
          itemCount,
          mode: z.enum(['disabled', 'external_shopify', 'mercadopago_legacy', 'shopify']),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...common,
      eventName: z.literal('audio_started'),
      properties: z.object({ trackId: id, source: z.enum(['direct', 'queue', 'radio']) }).strict(),
    })
    .strict(),
  z
    .object({
      ...common,
      eventName: z.literal('radio_demo_started'),
      properties: z.object({ channelId: id }).strict(),
    })
    .strict(),
  z
    .object({
      ...common,
      eventName: z.literal('event_request_submitted'),
      properties: z.object({ eventId }).strict(),
    })
    .strict(),
  z
    .object({
      ...common,
      eventName: z.literal('community_joined'),
      properties: z.object({ preferenceCount: count }).strict(),
    })
    .strict(),
  z
    .object({
      ...common,
      eventName: z.literal('radio_request_submitted'),
      properties: z.object({ planId: id }).strict(),
    })
    .strict(),
  z
    .object({
      ...common,
      eventName: z.literal('seller_application_submitted'),
      properties: z.object({}).strict(),
    })
    .strict(),
  z
    .object({
      ...common,
      eventName: z.literal('market_availability_requested'),
      properties: z.object({ listingId: eventId }).strict(),
    })
    .strict(),
]);

export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;
