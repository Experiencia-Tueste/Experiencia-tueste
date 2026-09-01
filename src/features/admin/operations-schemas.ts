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
  title: z.string().trim().min(2).max(180),
  category: z.string().trim().min(2).max(100),
  inventory: z.coerce.number().int().min(0).max(1_000_000),
  priceCents: z.coerce.number().int().min(1),
  notes: optionalText,
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
