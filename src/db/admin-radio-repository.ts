import 'server-only';

import { and, asc, eq } from 'drizzle-orm';
import { getDb } from './client';
import type { DbClient } from './db-types';
import { radioChannels, radioCompanies } from './schema/admin-radio';

export class DrizzleAdminRadioRepository {
  async workspace() {
    const db = getDb();
    const [companies, channels] = await Promise.all([
      db.select().from(radioCompanies).orderBy(asc(radioCompanies.name)),
      db.select().from(radioChannels).orderBy(asc(radioChannels.name)),
    ]);
    return { companies: companies.map(serialize), channels: channels.map(serialize) };
  }

  async createCompany(
    input: {
      name: string;
      contactName: string;
      contactEmail: string;
      city: string;
      actorId: string;
    },
    tx: DbClient,
  ) {
    const [row] = await tx
      .insert(radioCompanies)
      .values({
        name: input.name,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        city: input.city,
        createdBy: input.actorId,
      })
      .returning();
    return row;
  }

  async findCompanyById(id: string, tx: DbClient) {
    const [row] = await tx.select().from(radioCompanies).where(eq(radioCompanies.id, id)).limit(1);
    return row ?? null;
  }

  async createOrGetCompany(
    input: {
      name: string;
      contactName: string;
      contactEmail: string;
      city: string;
      actorId: string;
    },
    tx: DbClient,
  ) {
    const [existing] = await tx
      .select()
      .from(radioCompanies)
      .where(eq(radioCompanies.contactEmail, input.contactEmail))
      .limit(1);
    if (existing) return { row: existing, created: false };

    const [inserted] = await tx
      .insert(radioCompanies)
      .values({
        name: input.name,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        city: input.city,
        createdBy: input.actorId,
      })
      .onConflictDoNothing({ target: radioCompanies.contactEmail })
      .returning();
    if (inserted) return { row: inserted, created: true };

    const [concurrent] = await tx
      .select()
      .from(radioCompanies)
      .where(eq(radioCompanies.contactEmail, input.contactEmail))
      .limit(1);
    if (!concurrent) throw new Error('No fue posible vincular la empresa de Radio Origen.');
    return { row: concurrent, created: false };
  }

  async createChannel(
    input: { companyId: string; name: string; planId: string; notes?: string; actorId: string },
    tx: DbClient,
  ) {
    const [row] = await tx
      .insert(radioChannels)
      .values({
        companyId: input.companyId,
        name: input.name,
        planId: input.planId,
        notes: input.notes,
        createdBy: input.actorId,
      })
      .returning();
    return row;
  }

  async findChannelById(id: string, tx: DbClient) {
    const [row] = await tx.select().from(radioChannels).where(eq(radioChannels.id, id)).limit(1);
    return row ?? null;
  }

  async createOrGetChannel(
    input: {
      companyId: string;
      name: string;
      planId: string;
      notes?: string;
      actorId: string;
    },
    tx: DbClient,
  ) {
    const [existing] = await tx
      .select()
      .from(radioChannels)
      .where(and(eq(radioChannels.companyId, input.companyId), eq(radioChannels.name, input.name)))
      .limit(1);
    if (existing) return { row: existing, created: false };

    const [inserted] = await tx
      .insert(radioChannels)
      .values({
        companyId: input.companyId,
        name: input.name,
        planId: input.planId,
        notes: input.notes,
        createdBy: input.actorId,
      })
      .onConflictDoNothing({
        target: [radioChannels.companyId, radioChannels.name],
      })
      .returning();
    if (inserted) return { row: inserted, created: true };

    const [concurrent] = await tx
      .select()
      .from(radioChannels)
      .where(and(eq(radioChannels.companyId, input.companyId), eq(radioChannels.name, input.name)))
      .limit(1);
    if (!concurrent) throw new Error('No fue posible vincular el canal de Radio Origen.');
    return { row: concurrent, created: false };
  }

  async setSubscriptionStatus(id: string, from: string, to: string, tx: DbClient) {
    const [row] = await tx
      .update(radioChannels)
      .set({ subscriptionStatus: to, updatedAt: new Date() })
      .where(and(eq(radioChannels.id, id), eq(radioChannels.subscriptionStatus, from)))
      .returning();
    return row ?? null;
  }
}

function serialize<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

export function getAdminRadioRepository() {
  return new DrizzleAdminRadioRepository();
}
