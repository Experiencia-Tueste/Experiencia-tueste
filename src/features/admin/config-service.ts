import 'server-only';

import { randomUUID } from 'node:crypto';

import { getAdminConfigRepository } from '@/db/admin-config-repository';
import { getAdminRepository } from '@/db/admin-identity-repository';
import { getDb } from '@/db/client';
import { requireCapability } from '@/lib/auth/authorization';
import { parseAuditEntry } from './audit';
import {
  ADMIN_SETTING_DEFINITIONS,
  ADMIN_SETTING_INPUT_SCHEMA,
  type AdminSettingKey,
  ADMIN_INTEGRATION_INPUT_SCHEMA,
  COUPON_REFERENCE_INPUT_SCHEMA,
} from './config-schemas';

async function requireConfigManager() {
  return requireCapability('config.manage');
}

export async function listAdminSettings() {
  const admin = await requireConfigManager();
  const repository = getAdminConfigRepository();
  const [persisted, integrations, coupons] = await Promise.all([
    repository.listSettings(),
    repository.listIntegrations(),
    repository.listCoupons(),
  ]);
  const values = new Map(persisted.map((setting) => [setting.key, setting]));
  return {
    admin,
    settings: ADMIN_SETTING_DEFINITIONS.map((definition) => ({
      ...definition,
      value: values.get(definition.key)?.value ?? '',
      updatedAt: values.get(definition.key)?.updatedAt,
    })),
    integrations,
    coupons,
  };
}

export async function updateAdminIntegration(input: unknown) {
  const admin = await requireConfigManager();
  const parsed = ADMIN_INTEGRATION_INPUT_SCHEMA.parse(input);
  const repository = getAdminConfigRepository();
  return getDb().transaction(async (tx) => {
    const integration = await repository.upsertIntegration(
      {
        provider: parsed.provider,
        label: parsed.label,
        status: parsed.status,
        publicReference: parsed.publicReference,
        actorId: admin.id,
      },
      tx,
    );
    await getAdminRepository().appendAudit(
      parseAuditEntry({
        id: randomUUID(),
        actorUserId: admin.id,
        actorEmail: admin.email,
        action: 'integration.updated',
        targetType: 'integration',
        targetId: integration.id,
        occurredAt: new Date().toISOString(),
        reason: parsed.reason,
        metadata: { provider: parsed.provider, status: parsed.status },
      }),
      tx,
    );
    return integration;
  });
}

export async function upsertCouponReference(input: unknown) {
  const admin = await requireConfigManager();
  const parsed = COUPON_REFERENCE_INPUT_SCHEMA.parse(input);
  const repository = getAdminConfigRepository();
  return getDb().transaction(async (tx) => {
    const result = await repository.upsertCoupon(
      {
        code: parsed.code,
        label: parsed.label,
        externalId: parsed.externalId,
        status: parsed.status,
        actorId: admin.id,
      },
      tx,
    );
    await getAdminRepository().appendAudit(
      parseAuditEntry({
        id: randomUUID(),
        actorUserId: admin.id,
        actorEmail: admin.email,
        action: result.created ? 'coupon.created' : 'coupon.updated',
        targetType: 'coupon_reference',
        targetId: result.coupon.id,
        occurredAt: new Date().toISOString(),
        reason: parsed.reason,
        metadata: { code: parsed.code, status: parsed.status },
      }),
      tx,
    );
    return result.coupon;
  });
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
