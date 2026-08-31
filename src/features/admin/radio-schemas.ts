import { z } from 'zod';

const reason = z.string().trim().min(3).max(300);

export const RADIO_COMPANY_SCHEMA = z.object({
  name: z.string().trim().min(1).max(160),
  contactName: z.string().trim().min(1).max(120),
  contactEmail: z.string().trim().toLowerCase().email().max(254),
  city: z.string().trim().min(1).max(120),
  reason,
});

export const RADIO_CHANNEL_SCHEMA = z.object({
  companyId: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
  planId: z.enum(['senal', 'disenada', 'personalizada']),
  notes: z.string().trim().max(1000).optional(),
  reason,
});

export const RADIO_SUBSCRIPTION_STATUS_SCHEMA = z.object({
  id: z.string().uuid(),
  from: z.enum(['pending', 'trial', 'active', 'paused', 'cancelled']),
  to: z.enum(['pending', 'trial', 'active', 'paused', 'cancelled']),
  reason,
});

export function isRadioStatusChange(from: string, to: string) {
  return from !== to;
}
