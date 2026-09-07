import 'server-only';

import { and, desc, eq, gt, isNull, lte, sql } from 'drizzle-orm';

import { getDb } from './client';
import type { DbClient } from './db-types';
import {
  engagementRequests,
  pendingEngagementIntents,
  requestRateLimitBuckets,
} from './schema/admin-engagement';
import type {
  EngagementRequest,
  EngagementType,
  MarketApplicationStage,
  RadioOpportunityStage,
} from '@/features/engagements';

function serialize(row: typeof engagementRequests.$inferSelect): EngagementRequest {
  return {
    id: row.id,
    type: row.type as EngagementType,
    requesterUserId: row.requesterUserId,
    requesterEmail: row.requesterEmail,
    requesterName: row.requesterName,
    reference: row.reference,
    details: row.details,
    payload: (row.payload ?? {}) as EngagementRequest['payload'],
    status: row.status as EngagementRequest['status'],
    radioStage: (row.radioStage as RadioOpportunityStage | null) ?? null,
    radioCompanyId: row.radioCompanyId ?? null,
    radioChannelId: row.radioChannelId ?? null,
    marketStage: (row.marketStage as MarketApplicationStage | null) ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class DrizzleEngagementRepository {
  async list(): Promise<EngagementRequest[]> {
    const rows = await getDb()
      .select()
      .from(engagementRequests)
      .orderBy(desc(engagementRequests.createdAt));
    return rows.map(serialize);
  }

  async createOrGet(
    input: {
      type: EngagementType;
      requesterUserId: string;
      requesterEmail: string;
      requesterName: string;
      reference: string;
      details?: string;
      payload: EngagementRequest['payload'];
      radioStage?: RadioOpportunityStage | null;
      marketStage?: MarketApplicationStage | null;
    },
    tx: DbClient,
  ): Promise<{ request: EngagementRequest; created: boolean }> {
    const inserted = await tx
      .insert(engagementRequests)
      .values(input)
      .onConflictDoNothing({
        target: [
          engagementRequests.type,
          engagementRequests.requesterUserId,
          engagementRequests.reference,
        ],
      })
      .returning();
    if (inserted[0]) return { request: serialize(inserted[0]), created: true };

    const [existing] = await tx
      .select()
      .from(engagementRequests)
      .where(
        and(
          eq(engagementRequests.type, input.type),
          eq(engagementRequests.requesterUserId, input.requesterUserId),
          eq(engagementRequests.reference, input.reference),
        ),
      )
      .limit(1);
    if (!existing) throw new Error('No fue posible registrar la solicitud.');
    return { request: serialize(existing), created: false };
  }

  async updateCommunityPayload(
    id: string,
    details: string | null,
    payload: EngagementRequest['payload'],
    tx: DbClient,
  ) {
    const [row] = await tx
      .update(engagementRequests)
      .set({ details, payload, updatedAt: new Date() })
      .where(and(eq(engagementRequests.id, id), eq(engagementRequests.type, 'community')))
      .returning();
    return row ? serialize(row) : null;
  }

  async createPendingIntent(
    input: { tokenHash: string; payload: unknown; expiresAt: Date },
    tx: DbClient,
  ) {
    await tx.insert(pendingEngagementIntents).values({
      tokenHash: input.tokenHash,
      payload: input.payload,
      expiresAt: input.expiresAt,
    });
  }

  async findByIdForUpdate(id: string, tx: DbClient) {
    await tx.execute(
      sql`SELECT id FROM private.engagement_requests WHERE id = ${id}::uuid FOR UPDATE`,
    );
    const [row] = await tx
      .select()
      .from(engagementRequests)
      .where(eq(engagementRequests.id, id))
      .limit(1);
    return row ? serialize(row) : null;
  }

  /** Consume solo una vez y solo antes de que expire; la transacción externa completa la acción. */
  async consumePendingIntent(tokenHash: string, now: Date, tx: DbClient) {
    const [row] = await tx
      .update(pendingEngagementIntents)
      .set({ consumedAt: now })
      .where(
        and(
          eq(pendingEngagementIntents.tokenHash, tokenHash),
          isNull(pendingEngagementIntents.consumedAt),
          gt(pendingEngagementIntents.expiresAt, now),
        ),
      )
      .returning();
    return row ?? null;
  }

  /**
   * Incrementa atómicamente un bucket. La ventana vencida se reinicia en el
   * mismo upsert, por lo que funciona entre instancias del servicio web.
   */
  async incrementRateLimitBucket(
    input: { bucketKey: string; windowStartedAt: Date; now: Date; maxRequests: number },
    tx: DbClient,
  ) {
    const cappedCount = input.maxRequests + 1;
    const [row] = await tx
      .insert(requestRateLimitBuckets)
      .values({
        bucketKey: input.bucketKey,
        windowStartedAt: input.now,
        requestCount: 1,
        updatedAt: input.now,
      })
      .onConflictDoUpdate({
        target: requestRateLimitBuckets.bucketKey,
        set: {
          windowStartedAt: sql`CASE WHEN ${requestRateLimitBuckets.windowStartedAt} <= ${input.windowStartedAt} THEN ${input.now} ELSE ${requestRateLimitBuckets.windowStartedAt} END`,
          requestCount: sql`CASE WHEN ${requestRateLimitBuckets.windowStartedAt} <= ${input.windowStartedAt} THEN 1 ELSE LEAST(${requestRateLimitBuckets.requestCount} + 1, ${cappedCount}) END`,
          updatedAt: input.now,
        },
      })
      .returning({
        requestCount: requestRateLimitBuckets.requestCount,
        windowStartedAt: requestRateLimitBuckets.windowStartedAt,
      });
    return row;
  }

  async purgeExpiredPendingIntents(now: Date, tx: DbClient) {
    await tx.delete(pendingEngagementIntents).where(lte(pendingEngagementIntents.expiresAt, now));
  }

  async setStatus(
    id: string,
    from: EngagementRequest['status'],
    to: EngagementRequest['status'],
    tx: DbClient,
  ): Promise<EngagementRequest | null> {
    const [row] = await tx
      .update(engagementRequests)
      .set({ status: to, updatedAt: new Date() })
      .where(and(eq(engagementRequests.id, id), eq(engagementRequests.status, from)))
      .returning();
    return row ? serialize(row) : null;
  }

  async setRadioStage(
    id: string,
    from: RadioOpportunityStage,
    to: RadioOpportunityStage,
    tx: DbClient,
  ): Promise<EngagementRequest | null> {
    const [row] = await tx
      .update(engagementRequests)
      .set({ radioStage: to, updatedAt: new Date() })
      .where(
        and(
          eq(engagementRequests.id, id),
          eq(engagementRequests.type, 'radio'),
          eq(engagementRequests.radioStage, from),
        ),
      )
      .returning();
    return row ? serialize(row) : null;
  }

  async linkRadioActivation(
    id: string,
    radioCompanyId: string,
    radioChannelId: string,
    tx: DbClient,
  ): Promise<EngagementRequest | null> {
    const [row] = await tx
      .update(engagementRequests)
      .set({ radioCompanyId, radioChannelId, updatedAt: new Date() })
      .where(
        and(
          eq(engagementRequests.id, id),
          eq(engagementRequests.type, 'radio'),
          eq(engagementRequests.radioStage, 'won'),
        ),
      )
      .returning();
    return row ? serialize(row) : null;
  }

  async setMarketStage(
    id: string,
    from: MarketApplicationStage,
    to: MarketApplicationStage,
    tx: DbClient,
  ): Promise<EngagementRequest | null> {
    const [row] = await tx
      .update(engagementRequests)
      .set({ marketStage: to, updatedAt: new Date() })
      .where(
        and(
          eq(engagementRequests.id, id),
          eq(engagementRequests.type, 'market'),
          eq(engagementRequests.marketStage, from),
        ),
      )
      .returning();
    return row ? serialize(row) : null;
  }
}

export function getEngagementRepository() {
  return new DrizzleEngagementRepository();
}
