import 'server-only';

import { and, desc, eq } from 'drizzle-orm';

import { getDb } from './client';
import type { DbClient } from './db-types';
import { engagementRequests } from './schema/admin-engagement';
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
