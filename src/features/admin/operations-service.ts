import 'server-only';

import { randomUUID } from 'node:crypto';

import { getAdminRepository } from '@/db/admin-identity-repository';
import { getAdminOperationsRepository } from '@/db/admin-operations-repository';
import { getDb } from '@/db/client';
import { getCurrentAdmin } from '@/lib/auth/authorization';
import type { CurrentAdmin } from './authorization-core';
import { parseAuditEntry, type AuditAction } from './audit';
import {
  AUCTION_BID_SCHEMA,
  AUCTION_CREATE_SCHEMA,
  AUCTION_STATUS_SCHEMA,
  BACKSTAGE_PASS_CREATE_SCHEMA,
  BACKSTAGE_STATUS_SCHEMA,
  MARKET_LISTING_CREATE_SCHEMA,
  MARKET_STATUS_SCHEMA,
  TREE_ADOPTION_CREATE_SCHEMA,
  TREE_STATUS_SCHEMA,
  UNITY_OPPORTUNITY_CREATE_SCHEMA,
  UNITY_STAGE_SCHEMA,
  assertChanged,
  canTransitionAuction,
  canTransitionBackstage,
  canTransitionMarket,
  canTransitionTree,
  canTransitionUnity,
} from './operations-schemas';
import type { DbClient } from '@/db/db-types';
import type { AdminCapability } from './permissions';

type ManageCapability =
  'tree.update' | 'market.manage' | 'unity.manage' | 'auctions.manage' | 'backstage.manage';

function assertCapability(admin: CurrentAdmin, capability: AdminCapability) {
  if (!admin.capabilities.includes(capability)) throw new Error(`403: se requiere ${capability}.`);
}

async function requireManage(capability: ManageCapability) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('401: sesión administrativa requerida.');
  assertCapability(admin, capability);
  return admin;
}

function audit(
  admin: CurrentAdmin,
  action: AuditAction,
  targetType: string,
  targetId: string,
  reason: string,
  metadata: Record<string, unknown> = {},
) {
  return parseAuditEntry({
    id: randomUUID(),
    actorUserId: admin.id,
    actorEmail: admin.email,
    action,
    targetType,
    targetId,
    occurredAt: new Date().toISOString(),
    reason,
    metadata,
  });
}

export async function getTreeWorkspace(admin: CurrentAdmin) {
  assertCapability(admin, 'tree.read');
  return getAdminOperationsRepository().treeWorkspace();
}
export async function getMarketWorkspace(admin: CurrentAdmin) {
  assertCapability(admin, 'market.read');
  const workspace = await getAdminOperationsRepository().marketWorkspace();
  if (!admin.capabilities.includes('market.self') || admin.capabilities.includes('market.manage')) {
    return workspace;
  }
  const vendor = await getAdminRepository().findVendorByUserId(admin.id);
  return {
    ...workspace,
    vendors: vendor ? workspace.vendors.filter((item) => item.id === vendor.id) : [],
    listings: vendor ? workspace.listings.filter((item) => item.vendorId === vendor.id) : [],
  };
}
export async function getUnityWorkspace(admin: CurrentAdmin) {
  assertCapability(admin, 'unity.read');
  return getAdminOperationsRepository().unityWorkspace();
}
export async function getAuctionWorkspace(admin: CurrentAdmin) {
  assertCapability(admin, 'auctions.read');
  return getAdminOperationsRepository().auctionWorkspace();
}
export async function getBackstageWorkspace(admin: CurrentAdmin) {
  assertCapability(admin, 'backstage.read');
  return getAdminOperationsRepository().backstageWorkspace();
}

export async function createTreeAdoption(input: unknown) {
  const admin = await requireManage('tree.update');
  const parsed = TREE_ADOPTION_CREATE_SCHEMA.parse(input);
  const { reason, ...record } = parsed;
  return getDb().transaction(async (tx) => {
    const row = await getAdminOperationsRepository().createTree(
      { ...record, notes: record.notes || null, createdBy: admin.id, updatedBy: admin.id },
      tx,
    );
    await getAdminRepository().appendAudit(
      audit(admin, 'tree.adoption_created', 'tree_adoption', row.id, reason, {
        lotId: row.lotId,
        treesCount: row.treesCount,
      }),
      tx,
    );
    return row;
  });
}

export async function changeTreeAdoptionStatus(input: unknown) {
  const parsed = TREE_STATUS_SCHEMA.parse(input);
  if (!canTransitionTree(parsed.from, parsed.to)) throw new Error('400: transición inválida.');
  return changeStatus(parsed, 'tree.update', TREE_STATUS_SCHEMA, {
    action: 'tree.adoption_status_changed',
    targetType: 'tree_adoption',
    update: (id, from, to, actorId, tx) =>
      getAdminOperationsRepository().setTreeStatus(id, from, to, actorId, tx),
  });
}

export async function createMarketListing(input: unknown) {
  const admin = await requireManage('market.manage');
  const parsed = MARKET_LISTING_CREATE_SCHEMA.parse(input);
  const { reason, ...record } = parsed;
  return getDb().transaction(async (tx) => {
    const row = await getAdminOperationsRepository().createListing(
      { ...record, notes: record.notes || null, createdBy: admin.id, updatedBy: admin.id },
      tx,
    );
    await getAdminRepository().appendAudit(
      audit(admin, 'market.listing_created', 'market_listing', row.id, reason, {
        vendorId: row.vendorId,
        priceCents: row.priceCents,
      }),
      tx,
    );
    return row;
  });
}

export async function changeMarketListingStatus(input: unknown) {
  const parsed = MARKET_STATUS_SCHEMA.parse(input);
  if (!canTransitionMarket(parsed.from, parsed.to)) throw new Error('400: transición inválida.');
  return changeStatus(parsed, 'market.manage', MARKET_STATUS_SCHEMA, {
    action: 'market.listing_status_changed',
    targetType: 'market_listing',
    update: (id, from, to, actorId, tx) =>
      getAdminOperationsRepository().setListingStatus(id, from, to, actorId, tx),
  });
}

export async function createUnityOpportunity(input: unknown) {
  const admin = await requireManage('unity.manage');
  const parsed = UNITY_OPPORTUNITY_CREATE_SCHEMA.parse(input);
  const { reason, ...record } = parsed;
  return getDb().transaction(async (tx) => {
    const row = await getAdminOperationsRepository().createOpportunity(
      {
        ...record,
        nextStep: record.nextStep || null,
        nextContactAt: record.nextContactAt || null,
        estimatedValueCents: record.estimatedValueCents ?? null,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
      tx,
    );
    await getAdminRepository().appendAudit(
      audit(admin, 'unity.opportunity_created', 'unity_opportunity', row.id, reason, {
        service: row.service,
        organization: row.organization,
      }),
      tx,
    );
    return row;
  });
}

export async function changeUnityOpportunityStage(input: unknown) {
  const parsed = UNITY_STAGE_SCHEMA.parse(input);
  if (!canTransitionUnity(parsed.from, parsed.to)) throw new Error('400: transición inválida.');
  return changeStatus(parsed, 'unity.manage', UNITY_STAGE_SCHEMA, {
    action: 'unity.opportunity_stage_changed',
    targetType: 'unity_opportunity',
    update: (id, from, to, actorId, tx) =>
      getAdminOperationsRepository().setOpportunityStage(id, from, to, actorId, tx),
  });
}

export async function createAuction(input: unknown) {
  const admin = await requireManage('auctions.manage');
  const parsed = AUCTION_CREATE_SCHEMA.parse(input);
  const { reason, ...record } = parsed;
  return getDb().transaction(async (tx) => {
    const row = await getAdminOperationsRepository().createAuction(
      {
        ...record,
        lotId: record.lotId || null,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
      tx,
    );
    await getAdminRepository().appendAudit(
      audit(admin, 'auction.created', 'auction', row.id, reason, {
        lotId: row.lotId,
        reserveCents: row.reserveCents,
      }),
      tx,
    );
    return row;
  });
}

export async function changeAuctionStatus(input: unknown) {
  const parsed = AUCTION_STATUS_SCHEMA.parse(input);
  if (!canTransitionAuction(parsed.from, parsed.to)) throw new Error('400: transición inválida.');
  return changeStatus(parsed, 'auctions.manage', AUCTION_STATUS_SCHEMA, {
    action: 'auction.status_changed',
    targetType: 'auction',
    update: (id, from, to, actorId, tx) =>
      getAdminOperationsRepository().setAuctionStatus(id, from, to, actorId, tx),
  });
}

export async function recordAuctionBid(input: unknown) {
  const admin = await requireManage('auctions.manage');
  const parsed = AUCTION_BID_SCHEMA.parse(input);
  const { reason, ...record } = parsed;
  return getDb().transaction(async (tx) => {
    const row = await getAdminOperationsRepository().recordBid(
      { ...record, actorId: admin.id },
      tx,
    );
    await getAdminRepository().appendAudit(
      audit(admin, 'auction.bid_recorded', 'auction_bid', row.id, reason, {
        auctionId: row.auctionId,
        amountCents: row.amountCents,
      }),
      tx,
    );
    return row;
  });
}

export async function createBackstagePass(input: unknown) {
  const admin = await requireManage('backstage.manage');
  const parsed = BACKSTAGE_PASS_CREATE_SCHEMA.parse(input);
  const { reason, ...record } = parsed;
  return getDb().transaction(async (tx) => {
    const row = await getAdminOperationsRepository().createPass(
      {
        ...record,
        eventId: record.eventId || null,
        notes: record.notes || null,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
      tx,
    );
    await getAdminRepository().appendAudit(
      audit(admin, 'backstage.pass_created', 'backstage_pass', row.id, reason, {
        eventId: row.eventId,
        zone: row.zone,
      }),
      tx,
    );
    return row;
  });
}

export async function changeBackstagePassStatus(input: unknown) {
  const parsed = BACKSTAGE_STATUS_SCHEMA.parse(input);
  if (!canTransitionBackstage(parsed.from, parsed.to)) throw new Error('400: transición inválida.');
  return changeStatus(parsed, 'backstage.manage', BACKSTAGE_STATUS_SCHEMA, {
    action: 'backstage.pass_status_changed',
    targetType: 'backstage_pass',
    update: (id, from, to, actorId, tx) =>
      getAdminOperationsRepository().setPassStatus(id, from, to, actorId, tx),
  });
}

type StatusSchema = {
  parse(value: unknown): { id: string; from: string; to: string; reason: string };
};

async function changeStatus(
  input: unknown,
  capability: ManageCapability,
  schema: StatusSchema,
  config: {
    action: AuditAction;
    targetType: string;
    update: (
      id: string,
      from: string,
      to: string,
      actorId: string,
      tx: DbClient,
    ) => Promise<{ id: string } | null>;
  },
) {
  const admin = await requireManage(capability);
  const parsed = schema.parse(input);
  assertChanged(parsed.from, parsed.to);
  return getDb().transaction(async (tx) => {
    const row = await config.update(parsed.id, parsed.from, parsed.to, admin.id, tx);
    if (!row) throw new Error('409: el registro cambió de estado o ya no existe.');
    await getAdminRepository().appendAudit(
      audit(admin, config.action, config.targetType, row.id, parsed.reason, {
        from: parsed.from,
        to: parsed.to,
      }),
      tx,
    );
    return row;
  });
}
