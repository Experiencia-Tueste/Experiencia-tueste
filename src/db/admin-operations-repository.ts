import 'server-only';

import { and, asc, desc, eq, max, sql } from 'drizzle-orm';

import { getDb } from './client';
import type { DbClient } from './db-types';
import { farmLots, farms } from './schema/admin-compliance';
import { adminEvents } from './schema/admin-events';
import { vendors } from './schema/admin-identity';
import {
  auctionBids,
  auctionLots,
  backstagePasses,
  marketListings,
  treeAdoptions,
  unityOpportunities,
} from './schema/admin-operations';

const iso = (value: Date | null) => value?.toISOString() ?? null;

export class DrizzleAdminOperationsRepository {
  async references() {
    const db = getDb();
    const [lots, farmRows, vendorRows, events] = await Promise.all([
      db.select().from(farmLots).orderBy(asc(farmLots.code)),
      db.select().from(farms).orderBy(asc(farms.name)),
      db.select().from(vendors).orderBy(asc(vendors.name)),
      db.select().from(adminEvents).orderBy(desc(adminEvents.startsAt)),
    ]);
    return {
      lots: lots.map((row) => ({
        ...row,
        createdAt: iso(row.createdAt)!,
        updatedAt: iso(row.updatedAt)!,
      })),
      farms: farmRows.map((row) => ({
        ...row,
        createdAt: iso(row.createdAt)!,
        updatedAt: iso(row.updatedAt)!,
      })),
      vendors: vendorRows.map((row) => ({
        ...row,
        createdAt: iso(row.createdAt)!,
        updatedAt: iso(row.updatedAt)!,
      })),
      events: events.map((row) => ({
        ...row,
        startsAt: iso(row.startsAt)!,
        endsAt: iso(row.endsAt),
        createdAt: iso(row.createdAt)!,
        updatedAt: iso(row.updatedAt)!,
      })),
    };
  }

  async treeWorkspace() {
    const [references, rows] = await Promise.all([
      this.references(),
      getDb().select().from(treeAdoptions).orderBy(desc(treeAdoptions.createdAt)),
    ]);
    return {
      ...references,
      adoptions: rows.map((row) => ({
        ...row,
        createdAt: iso(row.createdAt)!,
        updatedAt: iso(row.updatedAt)!,
      })),
    };
  }

  async marketWorkspace() {
    const [references, rows] = await Promise.all([
      this.references(),
      getDb().select().from(marketListings).orderBy(desc(marketListings.createdAt)),
    ]);
    return {
      ...references,
      listings: rows.map((row) => ({
        ...row,
        createdAt: iso(row.createdAt)!,
        updatedAt: iso(row.updatedAt)!,
      })),
    };
  }

  async unityWorkspace() {
    const rows = await getDb()
      .select()
      .from(unityOpportunities)
      .orderBy(desc(unityOpportunities.updatedAt));
    return {
      opportunities: rows.map((row) => ({
        ...row,
        nextContactAt: iso(row.nextContactAt),
        createdAt: iso(row.createdAt)!,
        updatedAt: iso(row.updatedAt)!,
      })),
    };
  }

  async auctionWorkspace() {
    const [references, auctions, bids] = await Promise.all([
      this.references(),
      getDb().select().from(auctionLots).orderBy(desc(auctionLots.startsAt)),
      getDb().select().from(auctionBids).orderBy(desc(auctionBids.amountCents)),
    ]);
    return {
      ...references,
      auctions: auctions.map((row) => ({
        ...row,
        startsAt: iso(row.startsAt)!,
        endsAt: iso(row.endsAt)!,
        createdAt: iso(row.createdAt)!,
        updatedAt: iso(row.updatedAt)!,
      })),
      bids: bids.map((row) => ({ ...row, createdAt: iso(row.createdAt)! })),
    };
  }

  async backstageWorkspace() {
    const [references, passes] = await Promise.all([
      this.references(),
      getDb().select().from(backstagePasses).orderBy(desc(backstagePasses.startsAt)),
    ]);
    return {
      ...references,
      passes: passes.map((row) => ({
        ...row,
        startsAt: iso(row.startsAt)!,
        endsAt: iso(row.endsAt)!,
        createdAt: iso(row.createdAt)!,
        updatedAt: iso(row.updatedAt)!,
      })),
    };
  }

  async createTree(input: typeof treeAdoptions.$inferInsert, tx: DbClient) {
    const [row] = await tx.insert(treeAdoptions).values(input).returning();
    return row;
  }
  async createListing(input: typeof marketListings.$inferInsert, tx: DbClient) {
    const [row] = await tx.insert(marketListings).values(input).returning();
    return row;
  }
  async createOpportunity(input: typeof unityOpportunities.$inferInsert, tx: DbClient) {
    const [row] = await tx.insert(unityOpportunities).values(input).returning();
    return row;
  }
  async createAuction(input: typeof auctionLots.$inferInsert, tx: DbClient) {
    const [row] = await tx.insert(auctionLots).values(input).returning();
    return row;
  }
  async createPass(input: typeof backstagePasses.$inferInsert, tx: DbClient) {
    const [row] = await tx.insert(backstagePasses).values(input).returning();
    return row;
  }

  async setTreeStatus(id: string, from: string, to: string, actorId: string, tx: DbClient) {
    return updateStatus(tx, treeAdoptions, id, from, to, actorId);
  }
  async setListingStatus(id: string, from: string, to: string, actorId: string, tx: DbClient) {
    return updateStatus(tx, marketListings, id, from, to, actorId);
  }
  async setOpportunityStage(id: string, from: string, to: string, actorId: string, tx: DbClient) {
    const [row] = await tx
      .update(unityOpportunities)
      .set({ stage: to, updatedBy: actorId, updatedAt: new Date() })
      .where(and(eq(unityOpportunities.id, id), eq(unityOpportunities.stage, from)))
      .returning();
    return row ?? null;
  }
  async setAuctionStatus(id: string, from: string, to: string, actorId: string, tx: DbClient) {
    return updateStatus(tx, auctionLots, id, from, to, actorId);
  }
  async setPassStatus(id: string, from: string, to: string, actorId: string, tx: DbClient) {
    return updateStatus(tx, backstagePasses, id, from, to, actorId);
  }

  async recordBid(
    input: {
      auctionId: string;
      bidderName: string;
      bidderEmail: string;
      amountCents: number;
      actorId: string;
    },
    tx: DbClient,
  ) {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${input.auctionId}))`);
    const [auction] = await tx
      .select()
      .from(auctionLots)
      .where(eq(auctionLots.id, input.auctionId))
      .limit(1);
    if (!auction || auction.status !== 'open') throw new Error('409: la subasta no está abierta.');
    const [highest] = await tx
      .select({ amount: max(auctionBids.amountCents) })
      .from(auctionBids)
      .where(eq(auctionBids.auctionId, input.auctionId));
    const minimum = Math.max(auction.reserveCents, highest?.amount ?? 0);
    if (input.amountCents <= minimum)
      throw new Error('409: la oferta debe superar la actual y el precio de reserva.');
    const [row] = await tx
      .insert(auctionBids)
      .values({
        auctionId: input.auctionId,
        bidderName: input.bidderName,
        bidderEmail: input.bidderEmail,
        amountCents: input.amountCents,
        createdBy: input.actorId,
      })
      .returning();
    return row;
  }
}

async function updateStatus(
  tx: DbClient,
  table: typeof treeAdoptions | typeof marketListings | typeof auctionLots | typeof backstagePasses,
  id: string,
  from: string,
  to: string,
  actorId: string,
) {
  const [row] = await tx
    .update(table)
    .set({ status: to, updatedBy: actorId, updatedAt: new Date() })
    .where(and(eq(table.id, id), eq(table.status, from)))
    .returning();
  return row ?? null;
}

export function getAdminOperationsRepository() {
  return new DrizzleAdminOperationsRepository();
}
