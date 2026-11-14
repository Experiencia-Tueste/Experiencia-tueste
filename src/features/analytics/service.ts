import 'server-only';

import { desc, gte } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { getDb } from '@/db/client';
import { analyticsEvents, operationalErrors } from '@/db/schema/analytics';
import { analyticsEventSchema, type AnalyticsEventInput } from './event-contract';
import { summarizeAnalytics } from './metrics';

export async function recordAnalyticsEvent(input: unknown) {
  const event = analyticsEventSchema.parse(input);
  const [created] = await getDb()
    .insert(analyticsEvents)
    .values({
      eventId: event.eventId,
      eventName: event.eventName,
      eventVersion: event.eventVersion,
      properties: event.properties,
      source: 'web',
    })
    .onConflictDoNothing({ target: analyticsEvents.eventId })
    .returning({ id: analyticsEvents.id });
  return { accepted: true, duplicate: !created };
}

export async function recordOperationalError(input: {
  requestId?: string;
  route: string;
  operation: string;
  status: number;
  errorCode: string;
}) {
  const requestId = input.requestId ?? randomUUID();
  await getDb()
    .insert(operationalErrors)
    .values({
      requestId,
      route: input.route.slice(0, 160),
      operation: input.operation.slice(0, 120),
      status: input.status,
      errorCode: input.errorCode.slice(0, 120),
    });
}

export async function getAnalyticsSignals() {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const [events, errors] = await Promise.all([
    getDb()
      .select({ eventName: analyticsEvents.eventName, createdAt: analyticsEvents.createdAt })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, since))
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(10000),
    getDb()
      .select({
        route: operationalErrors.route,
        status: operationalErrors.status,
        createdAt: operationalErrors.createdAt,
      })
      .from(operationalErrors)
      .where(gte(operationalErrors.createdAt, since))
      .orderBy(desc(operationalErrors.createdAt))
      .limit(10000),
  ]);

  return summarizeAnalytics(
    events.map((event) => ({
      eventName: event.eventName as AnalyticsEventInput['eventName'],
      createdAt: event.createdAt,
    })),
    errors,
  );
}
