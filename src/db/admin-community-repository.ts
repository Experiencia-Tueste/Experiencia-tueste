import 'server-only';

import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb } from './client';
import type { DbClient } from './db-types';
import { communityMembers, communityPosts, communityReports } from './schema/admin-community';

export class DrizzleAdminCommunityRepository {
  async workspace() {
    const db = getDb();
    const [members, posts, reports] = await Promise.all([
      db.select().from(communityMembers).orderBy(desc(communityMembers.createdAt)),
      db.select().from(communityPosts).orderBy(desc(communityPosts.createdAt)),
      db.select().from(communityReports).orderBy(desc(communityReports.createdAt)),
    ]);
    return {
      members: members.map(serialize),
      posts: posts.map(serialize),
      reports: reports.map((row) => ({
        ...serialize(row),
        resolvedAt: row.resolvedAt?.toISOString() ?? null,
      })),
    };
  }

  async findMember(id: string, tx: DbClient) {
    const [row] = await tx
      .select()
      .from(communityMembers)
      .where(eq(communityMembers.id, id))
      .limit(1);
    return row ?? null;
  }

  async createMember(
    input: { displayName: string; email: string; notes?: string; actorId: string },
    tx: DbClient,
  ) {
    const [row] = await tx
      .insert(communityMembers)
      .values({
        displayName: input.displayName,
        email: input.email,
        notes: input.notes,
        createdBy: input.actorId,
      })
      .returning();
    return row;
  }

  async createPost(
    input: {
      memberId?: string;
      authorName: string;
      title: string;
      body: string;
      actorId: string;
    },
    tx: DbClient,
  ) {
    const [row] = await tx
      .insert(communityPosts)
      .values({
        memberId: input.memberId,
        authorName: input.authorName,
        title: input.title,
        body: input.body,
        createdBy: input.actorId,
      })
      .returning();
    return row;
  }

  async createReport(
    input: {
      postId: string;
      reporterName: string;
      category: string;
      details?: string;
      actorId: string;
    },
    tx: DbClient,
  ) {
    const [row] = await tx
      .insert(communityReports)
      .values({
        postId: input.postId,
        reporterName: input.reporterName,
        category: input.category,
        details: input.details,
        createdBy: input.actorId,
      })
      .returning();
    await tx
      .update(communityPosts)
      .set({ reportCount: sql`${communityPosts.reportCount} + 1`, updatedAt: new Date() })
      .where(eq(communityPosts.id, input.postId));
    return row;
  }

  async setMemberStatus(id: string, from: string, to: string, tx: DbClient) {
    const [row] = await tx
      .update(communityMembers)
      .set({ status: to, updatedAt: new Date() })
      .where(and(eq(communityMembers.id, id), eq(communityMembers.status, from)))
      .returning();
    return row ?? null;
  }

  async setPostStatus(id: string, from: string, to: string, tx: DbClient) {
    const [row] = await tx
      .update(communityPosts)
      .set({ status: to, updatedAt: new Date() })
      .where(and(eq(communityPosts.id, id), eq(communityPosts.status, from)))
      .returning();
    return row ?? null;
  }

  async resolveReport(
    id: string,
    from: string,
    to: string,
    resolution: string,
    actorId: string,
    tx: DbClient,
  ) {
    const now = new Date();
    const [row] = await tx
      .update(communityReports)
      .set({
        status: to,
        resolution,
        resolvedBy: actorId,
        resolvedAt: now,
        updatedAt: now,
      })
      .where(and(eq(communityReports.id, id), eq(communityReports.status, from)))
      .returning();
    return row ?? null;
  }
}

function serialize<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

export function getAdminCommunityRepository() {
  return new DrizzleAdminCommunityRepository();
}
