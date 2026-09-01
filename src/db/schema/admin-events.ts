import { sql } from 'drizzle-orm';
import { check, index, integer, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { adminUsers, privateSchema } from './admin-identity';

export const adminEvents = privateSchema.table(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    city: text('city').notNull(),
    venue: text('venue').notNull(),
    capacity: integer('capacity'),
    status: text('status').notNull().default('draft'),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('events_slug_unique').on(table.slug),
    index('events_starts_at_idx').on(table.startsAt),
    index('events_status_idx').on(table.status),
    check(
      'events_status_check',
      sql`${table.status} IN ('draft', 'open', 'waitlist', 'closed', 'cancelled')`,
    ),
    check('events_capacity_check', sql`${table.capacity} IS NULL OR ${table.capacity} > 0`),
    check(
      'events_dates_check',
      sql`${table.endsAt} IS NULL OR ${table.endsAt} > ${table.startsAt}`,
    ),
  ],
);

export const eventAttendees = privateSchema.table(
  'event_attendees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => adminEvents.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    ticketCode: uuid('ticket_code').notNull().defaultRandom(),
    status: text('status').notNull().default('reserved'),
    checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
    checkedInBy: uuid('checked_in_by').references(() => adminUsers.id, {
      onDelete: 'set null',
    }),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('event_attendees_event_email_unique').on(table.eventId, table.email),
    uniqueIndex('event_attendees_ticket_code_unique').on(table.ticketCode),
    index('event_attendees_event_status_idx').on(table.eventId, table.status),
    check(
      'event_attendees_status_check',
      sql`${table.status} IN ('reserved', 'waitlisted', 'checked_in', 'cancelled')`,
    ),
  ],
);
