import 'server-only';

import { asc, eq, sql } from 'drizzle-orm';

import { getDb } from './client';
import type { DbClient } from './db-types';
import { adminEvents, eventAttendees } from './schema/admin-events';
import type { AdminEventStatus, AttendeeStatus } from '@/features/admin/event-schemas';
import type { AdminEventRow, EventAttendeeRow } from '@/features/admin/event-types';

function mapEvent(row: typeof adminEvents.$inferSelect): AdminEventRow {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString() ?? null,
    city: row.city,
    venue: row.venue,
    capacity: row.capacity,
    status: row.status as AdminEventStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapAttendee(row: typeof eventAttendees.$inferSelect): EventAttendeeRow {
  return {
    id: row.id,
    eventId: row.eventId,
    name: row.name,
    email: row.email,
    ticketCode: row.ticketCode,
    status: row.status as AttendeeStatus,
    checkedInAt: row.checkedInAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export class DrizzleAdminEventRepository {
  async listEvents() {
    const rows = await getDb().select().from(adminEvents).orderBy(asc(adminEvents.startsAt));
    return rows.map(mapEvent);
  }

  async listAttendees() {
    const rows = await getDb().select().from(eventAttendees).orderBy(asc(eventAttendees.createdAt));
    return rows.map(mapAttendee);
  }

  async findEvent(id: string, tx?: DbClient) {
    const [row] = await (tx ?? getDb())
      .select()
      .from(adminEvents)
      .where(eq(adminEvents.id, id))
      .limit(1);
    return row ? mapEvent(row) : null;
  }

  async createEvent(
    input: {
      title: string;
      slug: string;
      startsAt: Date;
      endsAt?: Date;
      city: string;
      venue: string;
      capacity?: number;
      actorId: string;
    },
    tx?: DbClient,
  ) {
    const [row] = await (tx ?? getDb())
      .insert(adminEvents)
      .values({
        title: input.title,
        slug: input.slug,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        city: input.city,
        venue: input.venue,
        capacity: input.capacity,
        createdBy: input.actorId,
        updatedBy: input.actorId,
      })
      .returning();
    return mapEvent(row);
  }

  async setStatus(
    id: string,
    from: AdminEventStatus,
    to: AdminEventStatus,
    actorId: string,
    tx: DbClient,
  ) {
    const [row] = await tx
      .update(adminEvents)
      .set({ status: to, updatedBy: actorId, updatedAt: new Date() })
      .where(sql`${adminEvents.id} = ${id} AND ${adminEvents.status} = ${from}`)
      .returning();
    return row ? mapEvent(row) : null;
  }

  async lockEvent(id: string, tx: DbClient) {
    await tx.execute(sql`SELECT id FROM private.events WHERE id = ${id}::uuid FOR UPDATE`);
  }

  async countOccupied(eventId: string, tx: DbClient) {
    const [row] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(eventAttendees)
      .where(
        sql`${eventAttendees.eventId} = ${eventId} AND ${eventAttendees.status} IN ('reserved', 'checked_in')`,
      );
    return row?.count ?? 0;
  }

  async createAttendee(
    input: {
      eventId: string;
      name: string;
      email: string;
      status: 'reserved' | 'waitlisted';
      actorId: string;
    },
    tx: DbClient,
  ) {
    const [row] = await tx
      .insert(eventAttendees)
      .values({
        eventId: input.eventId,
        name: input.name,
        email: input.email,
        status: input.status,
        createdBy: input.actorId,
      })
      .returning();
    return mapAttendee(row);
  }

  async checkIn(eventId: string, ticketCode: string, actorId: string, tx: DbClient) {
    const [row] = await tx
      .update(eventAttendees)
      .set({
        status: 'checked_in',
        checkedInAt: new Date(),
        checkedInBy: actorId,
        updatedAt: new Date(),
      })
      .where(
        sql`${eventAttendees.eventId} = ${eventId} AND ${eventAttendees.ticketCode} = ${ticketCode}::uuid AND ${eventAttendees.status} = 'reserved'`,
      )
      .returning();
    return row ? mapAttendee(row) : null;
  }
}

export function getAdminEventRepository() {
  return new DrizzleAdminEventRepository();
}
