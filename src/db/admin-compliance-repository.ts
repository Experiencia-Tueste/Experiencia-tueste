import 'server-only';

import { asc, eq } from 'drizzle-orm';
import { getDb } from './client';
import type { DbClient } from './db-types';
import { complianceRecords, farmLots, farms } from './schema/admin-compliance';

export class DrizzleAdminComplianceRepository {
  async findLot(id: string, tx?: DbClient) {
    const [row] = await (tx ?? getDb()).select().from(farmLots).where(eq(farmLots.id, id)).limit(1);
    return row ?? null;
  }
  async workspace() {
    const db = getDb();
    const [farmRows, lotRows, recordRows] = await Promise.all([
      db.select().from(farms).orderBy(asc(farms.name)),
      db.select().from(farmLots).orderBy(asc(farmLots.code)),
      db.select().from(complianceRecords).orderBy(asc(complianceRecords.expiresAt)),
    ]);
    return {
      farms: farmRows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      lots: lotRows.map((row) => ({
        ...row,
        weightKg: row.weightKg ? Number(row.weightKg) : null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      records: recordRows.map((row) => ({
        ...row,
        issuedAt: row.issuedAt?.toISOString() ?? null,
        expiresAt: row.expiresAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
    };
  }

  async createFarm(
    input: {
      name: string;
      producerName: string;
      city: string;
      region: string;
      contactEmail?: string;
      actorId: string;
    },
    tx: DbClient,
  ) {
    const [row] = await tx
      .insert(farms)
      .values({
        name: input.name,
        producerName: input.producerName,
        city: input.city,
        region: input.region,
        contactEmail: input.contactEmail,
        createdBy: input.actorId,
      })
      .returning();
    return row;
  }

  async createLot(
    input: {
      farmId: string;
      code: string;
      harvestYear: number;
      variety: string;
      process: string;
      weightKg?: number;
      actorId: string;
    },
    tx: DbClient,
  ) {
    const [row] = await tx
      .insert(farmLots)
      .values({
        farmId: input.farmId,
        code: input.code,
        harvestYear: input.harvestYear,
        variety: input.variety,
        process: input.process,
        weightKg: input.weightKg?.toString(),
        createdBy: input.actorId,
      })
      .returning();
    return row;
  }

  async createRecord(
    input: {
      farmId: string;
      lotId?: string;
      kind: string;
      title: string;
      reference?: string;
      issuedAt?: Date;
      expiresAt?: Date;
      notes?: string;
      actorId: string;
    },
    tx: DbClient,
  ) {
    const [row] = await tx
      .insert(complianceRecords)
      .values({
        farmId: input.farmId,
        lotId: input.lotId,
        kind: input.kind,
        title: input.title,
        reference: input.reference,
        issuedAt: input.issuedAt,
        expiresAt: input.expiresAt,
        notes: input.notes,
        createdBy: input.actorId,
      })
      .returning();
    return row;
  }

  async setRecordStatus(id: string, status: string, tx: DbClient) {
    const [row] = await tx
      .update(complianceRecords)
      .set({ status, updatedAt: new Date() })
      .where(eq(complianceRecords.id, id))
      .returning();
    return row ?? null;
  }
}

export function getAdminComplianceRepository() {
  return new DrizzleAdminComplianceRepository();
}
