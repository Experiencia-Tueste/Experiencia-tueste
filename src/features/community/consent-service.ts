import 'server-only';

import { and, asc, eq, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { getDb } from '@/db/client';
import type { DbClient } from '@/db/db-types';
import { communityConsentEvents, communityMembers } from '@/db/schema/admin-community';
import {
  COMMUNITY_CONSENT_VERSION,
  isCommunityCommunicationAllowed,
  normalizeCommunityPreferences,
  type CommunityConsentInput,
} from './index';

export type CommunityConsentState = {
  memberId: string;
  requesterUserId: string;
  email: string;
  displayName: string;
  status: 'active' | 'restricted' | 'banned';
  consentStatus: 'active' | 'withdrawn';
  preferences: string[];
  consentVersion: number;
  consentedAt: string | null;
  withdrawnAt: string | null;
  updatedAt: string;
  events: CommunityConsentEvent[];
};

export type CommunityConsentEvent = {
  id: string;
  action: 'granted' | 'preferences_updated' | 'withdrawn' | 'restored';
  preferences: string[];
  consentVersion: number;
  source: 'public' | 'admin';
  reason: string | null;
  occurredAt: string;
};

type CommunityUser = { id: string; email: string; name?: string };

function serializeEvent(row: typeof communityConsentEvents.$inferSelect): CommunityConsentEvent {
  return {
    id: row.id,
    action: row.action as CommunityConsentEvent['action'],
    preferences: Array.isArray(row.preferences) ? (row.preferences as string[]) : ['general'],
    consentVersion: row.consentVersion,
    source: row.source as CommunityConsentEvent['source'],
    reason: row.reason,
    occurredAt: row.occurredAt.toISOString(),
  };
}

async function stateForMember(member: typeof communityMembers.$inferSelect, tx: DbClient) {
  const events = await tx
    .select()
    .from(communityConsentEvents)
    .where(eq(communityConsentEvents.memberId, member.id))
    .orderBy(asc(communityConsentEvents.occurredAt));
  return {
    memberId: member.id,
    requesterUserId: member.requesterUserId as string,
    email: member.email,
    displayName: member.displayName,
    status: member.status as CommunityConsentState['status'],
    consentStatus: member.consentStatus as CommunityConsentState['consentStatus'],
    preferences: Array.isArray(member.preferences) ? (member.preferences as string[]) : ['general'],
    consentVersion: member.consentVersion,
    consentedAt: member.consentedAt?.toISOString() ?? null,
    withdrawnAt: member.withdrawnAt?.toISOString() ?? null,
    updatedAt: member.updatedAt.toISOString(),
    events: events.map(serializeEvent),
  } satisfies CommunityConsentState;
}

async function findMemberForUpdate(userId: string, tx: DbClient) {
  await tx.execute(
    sql`SELECT id FROM private.community_members WHERE requester_user_id = ${userId}::uuid FOR UPDATE`,
  );
  const [member] = await tx
    .select()
    .from(communityMembers)
    .where(eq(communityMembers.requesterUserId, userId))
    .limit(1);
  return member ?? null;
}

async function appendEvent(
  member: typeof communityMembers.$inferSelect,
  input: {
    action: CommunityConsentEvent['action'];
    preferences: string[];
    source: 'public' | 'admin';
    reason?: string;
  },
  tx: DbClient,
) {
  await tx.insert(communityConsentEvents).values({
    id: randomUUID(),
    memberId: member.id,
    requesterUserId: member.requesterUserId as string,
    action: input.action,
    preferences: input.preferences,
    consentVersion: member.consentVersion,
    source: input.source,
    reason: input.reason,
  });
}

export async function saveCommunityConsentInTransaction(
  user: CommunityUser,
  input: CommunityConsentInput,
  tx: DbClient,
  sourceRequestId?: string,
) {
  const preferences = normalizeCommunityPreferences(input.preferences);
  const existing = await findMemberForUpdate(user.id, tx);
  const now = new Date();
  const email = user.email.trim().toLowerCase();
  const displayName = user.name?.trim() || email.split('@')[0] || 'Cliente Tueste';

  if (!existing) {
    const [member] = await tx
      .insert(communityMembers)
      .values({
        displayName,
        email,
        requesterUserId: user.id,
        sourceRequestId,
        status: 'active',
        preferences,
        consentStatus: 'active',
        consentVersion: COMMUNITY_CONSENT_VERSION,
        consentedAt: now,
        withdrawnAt: null,
      })
      .returning();
    await appendEvent(member, { action: 'granted', preferences, source: 'public' }, tx);
    return stateForMember(member, tx);
  }

  const currentPreferences = Array.isArray(existing.preferences)
    ? (existing.preferences as string[])
    : ['general'];
  const changed =
    existing.consentStatus !== 'active' ||
    JSON.stringify(currentPreferences) !== JSON.stringify(preferences);
  const [member] = await tx
    .update(communityMembers)
    .set({
      displayName,
      email,
      sourceRequestId: sourceRequestId ?? existing.sourceRequestId,
      preferences,
      consentStatus: 'active',
      consentVersion: COMMUNITY_CONSENT_VERSION,
      consentedAt: changed ? now : existing.consentedAt,
      withdrawnAt: null,
      updatedAt: now,
    })
    .where(eq(communityMembers.id, existing.id))
    .returning();
  if (changed) {
    await appendEvent(
      member,
      {
        action: existing.consentStatus === 'withdrawn' ? 'restored' : 'preferences_updated',
        preferences,
        source: 'public',
      },
      tx,
    );
  }
  return stateForMember(member, tx);
}

export async function saveCommunityConsent(user: CommunityUser, input: CommunityConsentInput) {
  return getDb().transaction((tx) => saveCommunityConsentInTransaction(user, input, tx));
}

export async function withdrawCommunityConsent(userId: string) {
  return getDb().transaction(async (tx) => {
    const existing = await findMemberForUpdate(userId, tx);
    if (!existing) return null;
    if (existing.consentStatus === 'withdrawn') return stateForMember(existing, tx);
    const now = new Date();
    const [member] = await tx
      .update(communityMembers)
      .set({ consentStatus: 'withdrawn', withdrawnAt: now, updatedAt: now })
      .where(
        and(eq(communityMembers.id, existing.id), eq(communityMembers.consentStatus, 'active')),
      )
      .returning();
    if (member) {
      await appendEvent(
        member,
        {
          action: 'withdrawn',
          preferences: Array.isArray(member.preferences)
            ? (member.preferences as string[])
            : ['general'],
          source: 'public',
        },
        tx,
      );
    }
    return stateForMember(member ?? existing, tx);
  });
}

export async function getCommunityConsent(userId: string) {
  const db = getDb();
  const [member] = await db
    .select()
    .from(communityMembers)
    .where(eq(communityMembers.requesterUserId, userId))
    .limit(1);
  return member ? stateForMember(member, db) : null;
}

export async function canCommunicateWithCommunityMember(userId: string) {
  const [member] = await getDb()
    .select({ consentStatus: communityMembers.consentStatus, status: communityMembers.status })
    .from(communityMembers)
    .where(eq(communityMembers.requesterUserId, userId))
    .limit(1);
  return member ? isCommunityCommunicationAllowed(member) : false;
}
