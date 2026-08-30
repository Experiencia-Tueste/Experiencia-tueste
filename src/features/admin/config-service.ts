import 'server-only';

import { randomUUID } from 'node:crypto';

import { getAdminConfigRepository } from '@/db/admin-config-repository';
import { getAdminRepository } from '@/db/admin-identity-repository';
import { getDb } from '@/db/client';
import { getCurrentAdmin } from '@/lib/auth/authorization';
import { parseAuditEntry } from './audit';
import {
  ADMIN_SETTING_DEFINITIONS,
  ADMIN_SETTING_INPUT_SCHEMA,
  type AdminSettingKey,
} from './config-schemas';

async function requireConfigManager() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('401: sesión requerida.');
  if (!admin.capabilities.includes('config.manage')) {
    throw new Error('403: capacidad config.manage requerida.');
  }
  return admin;
}

export async function listAdminSettings() {
  const admin = await requireConfigManager();
  const persisted = await getAdminConfigRepository().listSettings();
  const values = new Map(persisted.map((setting) => [setting.key, setting]));
  return {
    admin,
    settings: ADMIN_SETTING_DEFINITIONS.map((definition) => ({
      ...definition,
      value: values.get(definition.key)?.value ?? '',
      updatedAt: values.get(definition.key)?.updatedAt,
    })),
  };
}

export async function updateAdminSetting(input: unknown) {
  const admin = await requireConfigManager();
  const parsed = ADMIN_SETTING_INPUT_SCHEMA.parse(input);
  const repository = getAdminConfigRepository();
  const current = await repository.findSetting(parsed.key as AdminSettingKey);

  return getDb().transaction(async (tx) => {
    const setting = await repository.upsertSetting(
      { key: parsed.key, value: parsed.value, actorId: admin.id },
      tx,
    );
    await getAdminRepository().appendAudit(
      parseAuditEntry({
        id: randomUUID(),
        actorUserId: admin.id,
        actorEmail: admin.email,
        action: 'config.updated',
        targetType: 'admin_setting',
        targetId: setting.id,
        occurredAt: new Date().toISOString(),
        reason: parsed.reason,
        metadata: { key: parsed.key, changed: current?.value !== parsed.value },
      }),
      tx,
    );
    return setting;
  });
}
