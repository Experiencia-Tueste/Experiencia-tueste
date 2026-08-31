import 'server-only';

import { eq } from 'drizzle-orm';

import type { AdminSettingKey } from '@/features/admin/config-schemas';
import { getDb } from './client';
import type { DbClient } from './db-types';
import { adminIntegrations, adminSettings, couponReferences } from './schema/admin-config';

export type PersistedAdminSetting = {
  id: string;
  key: AdminSettingKey;
  value: string;
  updatedAt: string;
};
export type PersistedIntegration = {
  id: string;
  provider: string;
  label: string;
  status: 'disconnected' | 'configured' | 'degraded' | 'disabled';
  publicReference?: string;
  updatedAt: string;
};
export type PersistedCouponReference = {
  id: string;
  code: string;
  label: string;
  externalId?: string;
  status: 'active' | 'inactive' | 'expired';
  updatedAt: string;
};

export class DrizzleAdminConfigRepository {
  async listSettings(): Promise<PersistedAdminSetting[]> {
    const rows = await getDb().select().from(adminSettings).orderBy(adminSettings.key);
    return rows.map((row) => ({
      id: row.id,
      key: row.key as AdminSettingKey,
      value: row.value,
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async upsertSetting(
    input: { key: AdminSettingKey; value: string; actorId: string },
    tx?: DbClient,
  ): Promise<PersistedAdminSetting> {
    const db = tx ?? getDb();
    const [row] = await db
      .insert(adminSettings)
      .values({ key: input.key, value: input.value, updatedBy: input.actorId })
      .onConflictDoUpdate({
        target: adminSettings.key,
        set: { value: input.value, updatedBy: input.actorId, updatedAt: new Date() },
      })
      .returning();

    if (!row) throw new Error('No se pudo guardar la configuración.');
    return {
      id: row.id,
      key: row.key as AdminSettingKey,
      value: row.value,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async findSetting(key: AdminSettingKey): Promise<PersistedAdminSetting | null> {
    const [row] = await getDb()
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.key, key))
      .limit(1);
    if (!row) return null;
    return {
      id: row.id,
      key: row.key as AdminSettingKey,
      value: row.value,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listIntegrations(): Promise<PersistedIntegration[]> {
    const rows = await getDb().select().from(adminIntegrations).orderBy(adminIntegrations.provider);
    return rows.map((row) => ({
      id: row.id,
      provider: row.provider,
      label: row.label,
      status: row.status as PersistedIntegration['status'],
      publicReference: row.publicReference ?? undefined,
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async upsertIntegration(
    input: Omit<PersistedIntegration, 'id' | 'updatedAt'> & { actorId: string },
    tx?: DbClient,
  ): Promise<PersistedIntegration> {
    const db = tx ?? getDb();
    const [row] = await db
      .insert(adminIntegrations)
      .values({
        provider: input.provider,
        label: input.label,
        status: input.status,
        publicReference: input.publicReference || null,
        updatedBy: input.actorId,
      })
      .onConflictDoUpdate({
        target: adminIntegrations.provider,
        set: {
          label: input.label,
          status: input.status,
          publicReference: input.publicReference || null,
          updatedBy: input.actorId,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!row) throw new Error('No se pudo guardar la integración.');
    return {
      id: row.id,
      provider: row.provider,
      label: row.label,
      status: row.status as PersistedIntegration['status'],
      publicReference: row.publicReference ?? undefined,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listCoupons(): Promise<PersistedCouponReference[]> {
    const rows = await getDb().select().from(couponReferences).orderBy(couponReferences.code);
    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      label: row.label,
      externalId: row.externalId ?? undefined,
      status: row.status as PersistedCouponReference['status'],
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async upsertCoupon(
    input: Omit<PersistedCouponReference, 'id' | 'updatedAt'> & { actorId: string },
    tx?: DbClient,
  ): Promise<{ coupon: PersistedCouponReference; created: boolean }> {
    const db = tx ?? getDb();
    const [existing] = await db
      .select({ id: couponReferences.id })
      .from(couponReferences)
      .where(eq(couponReferences.code, input.code))
      .limit(1);
    const [row] = await db
      .insert(couponReferences)
      .values({
        code: input.code,
        label: input.label,
        externalId: input.externalId || null,
        status: input.status,
        updatedBy: input.actorId,
      })
      .onConflictDoUpdate({
        target: couponReferences.code,
        set: {
          label: input.label,
          externalId: input.externalId || null,
          status: input.status,
          updatedBy: input.actorId,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!row) throw new Error('No se pudo guardar el cupón.');
    return {
      created: !existing,
      coupon: {
        id: row.id,
        code: row.code,
        label: row.label,
        externalId: row.externalId ?? undefined,
        status: row.status as PersistedCouponReference['status'],
        updatedAt: row.updatedAt.toISOString(),
      },
    };
  }
}

export function getAdminConfigRepository() {
  return new DrizzleAdminConfigRepository();
}
