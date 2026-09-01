import { z } from 'zod';

const reason = z.string().trim().min(3).max(300);
const optionalDate = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.coerce.date().optional(),
);

export const FARM_SCHEMA = z.object({
  name: z.string().trim().min(1).max(160),
  producerName: z.string().trim().min(1).max(160),
  city: z.string().trim().min(1).max(120),
  region: z.string().trim().min(1).max(120),
  contactEmail: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().trim().toLowerCase().email().optional(),
  ),
  reason,
});

export const FARM_LOT_SCHEMA = z.object({
  farmId: z.string().uuid(),
  code: z.string().trim().toUpperCase().min(1).max(80),
  harvestYear: z.coerce.number().int().min(2000).max(2200),
  variety: z.string().trim().min(1).max(120),
  process: z.string().trim().min(1).max(120),
  weightKg: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
  reason,
});

export const COMPLIANCE_RECORD_SCHEMA = z
  .object({
    farmId: z.string().uuid(),
    lotId: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.string().uuid().optional(),
    ),
    kind: z.enum(['certificate', 'inspection', 'document', 'communication']),
    title: z.string().trim().min(1).max(200),
    reference: z.string().trim().max(200).optional(),
    issuedAt: optionalDate,
    expiresAt: optionalDate,
    notes: z.string().trim().max(2000).optional(),
    reason,
  })
  .refine((input) => !input.issuedAt || !input.expiresAt || input.expiresAt > input.issuedAt, {
    path: ['expiresAt'],
    message: 'El vencimiento debe ser posterior a la emisión.',
  });

export const COMPLIANCE_STATUS_SCHEMA = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'valid', 'rejected', 'archived']),
  reason,
});

export function expiryState(expiresAt: string | null, now: Date) {
  if (!expiresAt) return 'sin-vencimiento' as const;
  const remaining = new Date(expiresAt).getTime() - now.getTime();
  if (remaining < 0) return 'vencido' as const;
  if (remaining <= 30 * 24 * 60 * 60 * 1000) return 'por-vencer' as const;
  return 'vigente' as const;
}
