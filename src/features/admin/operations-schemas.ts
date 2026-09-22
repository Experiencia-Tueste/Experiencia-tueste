import { z } from 'zod';

const reason = z.string().trim().min(3).max(300);
const email = z.string().trim().toLowerCase().email().max(254);
const optionalText = z.string().trim().max(1200).optional();

export const TREE_STATUSES = ['pending', 'active', 'fulfilled', 'cancelled'] as const;
export const MARKET_STATUSES = ['draft', 'review', 'published', 'paused', 'archived'] as const;
export const UNITY_STAGES = ['lead', 'qualified', 'proposal', 'won', 'lost'] as const;
export const AUCTION_STATUSES = ['draft', 'approved', 'open', 'closed', 'cancelled'] as const;
export const BACKSTAGE_STATUSES = [
  'requested',
  'approved',
  'issued',
  'revoked',
  'expired',
] as const;
export const MARKET_IMAGE_MAX_BYTES = 5_000_000;

const marketProductFields = {
  title: z.string().trim().min(2).max(180),
  brand: z.string().trim().min(2).max(180),
  category: z.string().trim().min(2).max(100),
  variety: z.string().trim().min(2).max(120),
  process: z.string().trim().min(2).max(160),
  origin: z.string().trim().min(2).max(180),
  presentation: z.string().trim().min(2).max(120),
  weightGrams: z.coerce.number().int().min(0).max(1_000_000),
  inventory: z.coerce.number().int().min(0).max(1_000_000),
  priceCents: z.coerce.number().int().min(1).max(2_000_000_000),
  imagePath: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
  imageSizeBytes: z.preprocess(
    (value) => (value === '' || value === undefined ? 0 : value),
    z.coerce.number().int().min(0).max(MARKET_IMAGE_MAX_BYTES),
  ),
  delivery: z.string().trim().min(2).max(500),
  traceability: z.string().trim().min(2).max(1200),
  notes: optionalText,
};

export const TREE_ADOPTION_CREATE_SCHEMA = z.object({
  lotId: z.string().uuid(),
  adopterName: z.string().trim().min(2).max(160),
  adopterEmail: email,
  treesCount: z.coerce.number().int().min(1).max(10_000),
  certificateCode: z.string().trim().min(3).max(80),
  notes: optionalText,
  reason,
});

export const MARKET_LISTING_CREATE_SCHEMA = z.object({
  vendorId: z.string().uuid(),
  ...marketProductFields,
  reason,
});

export const MARKET_LISTING_SELF_CREATE_SCHEMA = MARKET_LISTING_CREATE_SCHEMA.omit({
  vendorId: true,
});

export const MARKET_LISTING_UPDATE_SCHEMA = z.object({
  id: z.string().uuid(),
  ...marketProductFields,
  reason,
});

export const MARKET_LISTING_REVIEW_SCHEMA = z.object({
  id: z.string().uuid(),
  reason,
});

export const UNITY_OPPORTUNITY_CREATE_SCHEMA = z.object({
  organization: z.string().trim().min(2).max(180),
  contactName: z.string().trim().min(2).max(160),
  contactEmail: email,
  service: z.string().trim().min(2).max(160),
  estimatedValueCents: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.coerce.number().int().min(0).optional(),
  ),
  nextStep: optionalText,
  nextContactAt: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.coerce.date().optional(),
  ),
  reason,
});

export const AUCTION_CREATE_SCHEMA = z
  .object({
    lotId: z.preprocess(
      (value) => (value === '' || value === undefined ? undefined : value),
      z.string().uuid().optional(),
    ),
    title: z.string().trim().min(2).max(180),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    reserveCents: z.coerce.number().int().min(1),
    reason,
  })
  .refine((value) => value.endsAt > value.startsAt, {
    path: ['endsAt'],
    message: 'El cierre debe ser posterior a la apertura.',
  });

export const AUCTION_BID_SCHEMA = z.object({
  auctionId: z.string().uuid(),
  bidderName: z.string().trim().min(2).max(160),
  bidderEmail: email,
  amountCents: z.coerce.number().int().min(1),
  reason,
});

export const BACKSTAGE_PASS_CREATE_SCHEMA = z
  .object({
    eventId: z.preprocess(
      (value) => (value === '' || value === undefined ? undefined : value),
      z.string().uuid().optional(),
    ),
    holderName: z.string().trim().min(2).max(160),
    holderEmail: email,
    zone: z.string().trim().min(2).max(100),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    notes: optionalText,
    reason,
  })
  .refine((value) => value.endsAt > value.startsAt, {
    path: ['endsAt'],
    message: 'La vigencia final debe ser posterior al inicio.',
  });

function statusChange<const T extends readonly [string, ...string[]]>(statuses: T) {
  return z.object({
    id: z.string().uuid(),
    from: z.enum(statuses),
    to: z.enum(statuses),
    reason,
  });
}

export const TREE_STATUS_SCHEMA = statusChange(TREE_STATUSES);
export const MARKET_STATUS_SCHEMA = statusChange(MARKET_STATUSES);
export const UNITY_STAGE_SCHEMA = statusChange(UNITY_STAGES);
export const AUCTION_STATUS_SCHEMA = statusChange(AUCTION_STATUSES);
export const BACKSTAGE_STATUS_SCHEMA = statusChange(BACKSTAGE_STATUSES);

export function assertChanged(from: string, to: string) {
  if (from === to) throw new Error('400: el estado no cambió.');
}

export function canTransitionAuction(from: string, to: string) {
  const transitions: Record<string, readonly string[]> = {
    draft: ['approved', 'cancelled'],
    approved: ['open', 'cancelled'],
    open: ['closed', 'cancelled'],
    closed: [],
    cancelled: [],
  };
  return transitions[from]?.includes(to) ?? false;
}

function canTransition(from: string, to: string, transitions: Record<string, readonly string[]>) {
  return transitions[from]?.includes(to) ?? false;
}

export function canTransitionTree(from: string, to: string) {
  return canTransition(from, to, {
    pending: ['active', 'cancelled'],
    active: ['fulfilled', 'cancelled'],
    fulfilled: [],
    cancelled: [],
  });
}

export function canTransitionMarket(from: string, to: string) {
  return canTransition(from, to, {
    draft: ['review', 'archived'],
    review: ['draft', 'published', 'archived'],
    published: ['paused', 'archived'],
    paused: ['published', 'archived'],
    archived: [],
  });
}

export function validateMarketImage(input: {
  vendorId: string;
  imagePath?: string | null;
  imageSizeBytes?: number | null;
}) {
  const path = input.imagePath?.trim();
  const size = input.imageSizeBytes ?? 0;
  if (!path) {
    if (size !== 0) throw new Error('400: una imagen sin ruta no puede tener tamaño.');
    return;
  }
  if (size < 1 || size > MARKET_IMAGE_MAX_BYTES) {
    throw new Error(`400: la imagen debe pesar entre 1 y ${MARKET_IMAGE_MAX_BYTES} bytes.`);
  }
  const expectedPrefix = `vendors/${input.vendorId}/`;
  if (!path.startsWith(expectedPrefix) || path.includes('..') || path.includes('?')) {
    throw new Error('400: la imagen no pertenece a la ruta del vendedor.');
  }
  if (!/\.(?:jpg|jpeg|png|webp)$/i.test(path)) {
    throw new Error('400: la imagen debe ser JPG, PNG o WebP.');
  }
}

export function assertMarketListingComplete(input: {
  vendorId: string;
  brand?: string | null;
  title?: string | null;
  category?: string | null;
  variety?: string | null;
  process?: string | null;
  origin?: string | null;
  presentation?: string | null;
  weightGrams?: number | null;
  inventory?: number | null;
  priceCents?: number | null;
  imagePath?: string | null;
  imageSizeBytes?: number | null;
  delivery?: string | null;
  traceability?: string | null;
}) {
  const required: Array<[string, string | null | undefined]> = [
    ['título', input.title],
    ['marca', input.brand],
    ['categoría', input.category],
    ['variedad', input.variety],
    ['proceso', input.process],
    ['origen', input.origin],
    ['presentación', input.presentation],
    ['entrega', input.delivery],
    ['trazabilidad', input.traceability],
  ];
  const missing = required.find(([, value]) => !value?.trim());
  if (missing) throw new Error(`400: el producto está incompleto; falta ${missing[0]}.`);
  if (
    typeof input.weightGrams !== 'number' ||
    !Number.isInteger(input.weightGrams) ||
    input.weightGrams < 1
  ) {
    throw new Error('400: el peso debe ser un entero mayor que cero.');
  }
  if (
    typeof input.inventory !== 'number' ||
    !Number.isInteger(input.inventory) ||
    input.inventory < 0
  ) {
    throw new Error('400: el inventario debe ser un entero no negativo.');
  }
  if (
    typeof input.priceCents !== 'number' ||
    !Number.isInteger(input.priceCents) ||
    input.priceCents < 1
  ) {
    throw new Error('400: el precio debe ser un entero mayor que cero.');
  }
  validateMarketImage(input);
}

export function canTransitionUnity(from: string, to: string) {
  return canTransition(from, to, {
    lead: ['qualified', 'lost'],
    qualified: ['proposal', 'lost'],
    proposal: ['won', 'lost', 'qualified'],
    won: [],
    lost: ['lead'],
  });
}

export function canTransitionBackstage(from: string, to: string) {
  return canTransition(from, to, {
    requested: ['approved', 'revoked'],
    approved: ['issued', 'revoked'],
    issued: ['expired', 'revoked'],
    revoked: [],
    expired: [],
  });
}
