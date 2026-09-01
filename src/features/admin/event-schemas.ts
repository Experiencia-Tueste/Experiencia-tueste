import { z } from 'zod';

export const ADMIN_EVENT_STATUS = ['draft', 'open', 'waitlist', 'closed', 'cancelled'] as const;
export type AdminEventStatus = (typeof ADMIN_EVENT_STATUS)[number];

export const ATTENDEE_STATUS = ['reserved', 'waitlisted', 'checked_in', 'cancelled'] as const;
export type AttendeeStatus = (typeof ATTENDEE_STATUS)[number];

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => value.replace(/[–—]/g, '-').replace(/\s+/g, '-'))
  .pipe(
    z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9-]+$/),
  );

export const EVENT_CREATE_SCHEMA = z
  .object({
    title: z.string().trim().min(1).max(200),
    slug,
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date().optional(),
    city: z.string().trim().min(1).max(120),
    venue: z.string().trim().min(1).max(200),
    capacity: z.coerce.number().int().positive().max(100000).optional(),
    reason: z.string().trim().min(3).max(300),
  })
  .refine((input) => !input.endsAt || input.endsAt > input.startsAt, {
    path: ['endsAt'],
    message: 'La fecha final debe ser posterior al inicio.',
  });

export const EVENT_STATUS_SCHEMA = z.object({
  id: z.string().uuid(),
  from: z.enum(ADMIN_EVENT_STATUS),
  to: z.enum(ADMIN_EVENT_STATUS),
  reason: z.string().trim().min(3).max(300),
});

export const ATTENDEE_CREATE_SCHEMA = z.object({
  eventId: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().toLowerCase().email(),
  reason: z.string().trim().min(3).max(300),
});

export const CHECK_IN_SCHEMA = z.object({
  eventId: z.string().uuid(),
  ticketCode: z.string().uuid(),
  reason: z.string().trim().min(3).max(300),
});

const EVENT_STATUS_TRANSITIONS: ReadonlyArray<readonly [AdminEventStatus, AdminEventStatus]> = [
  ['draft', 'open'],
  ['open', 'waitlist'],
  ['open', 'closed'],
  ['waitlist', 'open'],
  ['waitlist', 'closed'],
  ['draft', 'cancelled'],
  ['open', 'cancelled'],
  ['waitlist', 'cancelled'],
];

export function canTransitionEvent(from: AdminEventStatus, to: AdminEventStatus) {
  return EVENT_STATUS_TRANSITIONS.some(([current, next]) => current === from && next === to);
}
