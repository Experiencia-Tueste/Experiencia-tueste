import 'server-only';

import { randomUUID } from 'node:crypto';
import { getAdminCommunityRepository } from '@/db/admin-community-repository';
import { getAdminRepository } from '@/db/admin-identity-repository';
import { getDb } from '@/db/client';
import { getCurrentAdmin } from '@/lib/auth/authorization';
import type { CurrentAdmin } from './authorization-core';
import { parseAuditEntry, type AuditAction } from './audit';
import {
  COMMUNITY_MEMBER_SCHEMA,
  COMMUNITY_MEMBER_STATUS_SCHEMA,
  COMMUNITY_POST_SCHEMA,
  COMMUNITY_POST_STATUS_SCHEMA,
  COMMUNITY_REPORT_SCHEMA,
  COMMUNITY_REPORT_STATUS_SCHEMA,
  isCommunityStatusChange,
} from './community-schemas';

function assertRead(admin: CurrentAdmin) {
  if (!admin.capabilities.includes('community.read')) {
    throw new Error('403: se requiere community.read.');
  }
}

async function requireModeration() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('401: sesión administrativa requerida.');
  if (!admin.capabilities.includes('community.moderate')) {
    throw new Error('403: se requiere community.moderate.');
  }
  return admin;
}

function audit(
  admin: CurrentAdmin,
  action: Extract<
    AuditAction,
    | 'community.member_created'
    | 'community.member_status_changed'
    | 'community.post_created'
    | 'community.post_status_changed'
    | 'community.report_created'
    | 'community.report_resolved'
  >,
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

export async function getCommunityWorkspace(admin: CurrentAdmin) {
  assertRead(admin);
  return getAdminCommunityRepository().workspace();
}

export async function createCommunityMember(input: unknown) {
  const admin = await requireModeration();
  const parsed = COMMUNITY_MEMBER_SCHEMA.parse(input);
  return getDb().transaction(async (tx) => {
    const row = await getAdminCommunityRepository().createMember(
      { ...parsed, actorId: admin.id },
      tx,
    );
    await getAdminRepository().appendAudit(
      audit(admin, 'community.member_created', 'community_member', row.id, parsed.reason, {
        email: row.email,
      }),
      tx,
    );
    return row;
  });
}

export async function createCommunityPost(input: unknown) {
  const admin = await requireModeration();
  const parsed = COMMUNITY_POST_SCHEMA.parse(input);
  return getDb().transaction(async (tx) => {
    const repository = getAdminCommunityRepository();
    if (parsed.memberId) {
      const member = await repository.findMember(parsed.memberId, tx);
      if (!member) throw new Error('404: miembro no encontrado.');
    }
    const row = await repository.createPost({ ...parsed, actorId: admin.id }, tx);
    await getAdminRepository().appendAudit(
      audit(admin, 'community.post_created', 'community_post', row.id, parsed.reason, {
        memberId: row.memberId,
      }),
      tx,
    );
    return row;
  });
}

export async function createCommunityReport(input: unknown) {
  const admin = await requireModeration();
  const parsed = COMMUNITY_REPORT_SCHEMA.parse(input);
  return getDb().transaction(async (tx) => {
    const row = await getAdminCommunityRepository().createReport(
      { ...parsed, actorId: admin.id },
      tx,
    );
    await getAdminRepository().appendAudit(
      audit(admin, 'community.report_created', 'community_report', row.id, parsed.reason, {
        postId: row.postId,
        category: row.category,
      }),
      tx,
    );
    return row;
  });
}

export async function changeCommunityMemberStatus(input: unknown) {
  const admin = await requireModeration();
  const parsed = COMMUNITY_MEMBER_STATUS_SCHEMA.parse(input);
  if (!isCommunityStatusChange(parsed.from, parsed.to)) throw new Error('400: estado sin cambios.');
  return getDb().transaction(async (tx) => {
    const row = await getAdminCommunityRepository().setMemberStatus(
      parsed.id,
      parsed.from,
      parsed.to,
      tx,
    );
    if (!row) throw new Error('409: el miembro cambió de estado o no existe.');
    await getAdminRepository().appendAudit(
      audit(admin, 'community.member_status_changed', 'community_member', row.id, parsed.reason, {
        from: parsed.from,
        to: parsed.to,
      }),
      tx,
    );
    return row;
  });
}

export async function changeCommunityPostStatus(input: unknown) {
  const admin = await requireModeration();
  const parsed = COMMUNITY_POST_STATUS_SCHEMA.parse(input);
  if (!isCommunityStatusChange(parsed.from, parsed.to)) throw new Error('400: estado sin cambios.');
  return getDb().transaction(async (tx) => {
    const row = await getAdminCommunityRepository().setPostStatus(
      parsed.id,
      parsed.from,
      parsed.to,
      tx,
    );
    if (!row) throw new Error('409: la publicación cambió de estado o no existe.');
    await getAdminRepository().appendAudit(
      audit(admin, 'community.post_status_changed', 'community_post', row.id, parsed.reason, {
        from: parsed.from,
        to: parsed.to,
      }),
      tx,
    );
    return row;
  });
}

export async function resolveCommunityReport(input: unknown) {
  const admin = await requireModeration();
  const parsed = COMMUNITY_REPORT_STATUS_SCHEMA.parse(input);
  return getDb().transaction(async (tx) => {
    const row = await getAdminCommunityRepository().resolveReport(
      parsed.id,
      parsed.from,
      parsed.to,
      parsed.resolution,
      admin.id,
      tx,
    );
    if (!row) throw new Error('409: el reporte ya fue atendido o no existe.');
    await getAdminRepository().appendAudit(
      audit(admin, 'community.report_resolved', 'community_report', row.id, parsed.reason, {
        from: parsed.from,
        to: parsed.to,
        postId: row.postId,
      }),
      tx,
    );
    return row;
  });
}
