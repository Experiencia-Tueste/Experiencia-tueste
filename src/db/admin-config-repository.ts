import 'server-only';

import { eq } from 'drizzle-orm';

import type { AdminSettingKey } from '@/features/admin/config-schemas';
import { getDb } from './client';
import type { DbClient } from './db-types';
import { adminSettings } from './schema/admin-config';

export type PersistedAdminSetting = {
  id: string;
  key: AdminSettingKey;
  value: string;
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
}

export function getAdminConfigRepository() {
  return new DrizzleAdminConfigRepository();
}
