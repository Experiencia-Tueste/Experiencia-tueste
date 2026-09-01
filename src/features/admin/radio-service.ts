import 'server-only';

import { randomUUID } from 'node:crypto';
import { getAdminRepository } from '@/db/admin-identity-repository';
import { getAdminRadioRepository } from '@/db/admin-radio-repository';
import { getDb } from '@/db/client';
import { getCurrentAdmin } from '@/lib/auth/authorization';
import type { CurrentAdmin } from './authorization-core';
import { parseAuditEntry, type AuditAction } from './audit';
import {
  RADIO_CHANNEL_SCHEMA,
  RADIO_COMPANY_SCHEMA,
  RADIO_SUBSCRIPTION_STATUS_SCHEMA,
  isRadioStatusChange,
} from './radio-schemas';

function assertRead(admin: CurrentAdmin) {
  if (!admin.capabilities.includes('radio.read')) throw new Error('403: se requiere radio.read.');
}
async function requireManage() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('401: sesión administrativa requerida.');
  if (!admin.capabilities.includes('radio.manage'))
    throw new Error('403: se requiere radio.manage.');
  return admin;
}
function audit(
  admin: CurrentAdmin,
  action: Extract<
    AuditAction,
    'radio.company_created' | 'radio.channel_created' | 'radio.subscription_status_changed'
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

export async function getRadioWorkspace(admin: CurrentAdmin) {
  assertRead(admin);
  return getAdminRadioRepository().workspace();
}

export async function createRadioCompany(input: unknown) {
  const admin = await requireManage();
  const parsed = RADIO_COMPANY_SCHEMA.parse(input);
  return getDb().transaction(async (tx) => {
    const row = await getAdminRadioRepository().createCompany({ ...parsed, actorId: admin.id }, tx);
    await getAdminRepository().appendAudit(
      audit(admin, 'radio.company_created', 'radio_company', row.id, parsed.reason, {
        city: row.city,
      }),
      tx,
    );
    return row;
  });
}

export async function createRadioChannel(input: unknown) {
  const admin = await requireManage();
  const parsed = RADIO_CHANNEL_SCHEMA.parse(input);
  return getDb().transaction(async (tx) => {
    const row = await getAdminRadioRepository().createChannel({ ...parsed, actorId: admin.id }, tx);
    await getAdminRepository().appendAudit(
      audit(admin, 'radio.channel_created', 'radio_channel', row.id, parsed.reason, {
        companyId: row.companyId,
        planId: row.planId,
      }),
      tx,
    );
    return row;
  });
}

export async function changeRadioSubscriptionStatus(input: unknown) {
  const admin = await requireManage();
  const parsed = RADIO_SUBSCRIPTION_STATUS_SCHEMA.parse(input);
  if (!isRadioStatusChange(parsed.from, parsed.to)) throw new Error('400: estado sin cambios.');
  return getDb().transaction(async (tx) => {
    const row = await getAdminRadioRepository().setSubscriptionStatus(
      parsed.id,
      parsed.from,
      parsed.to,
      tx,
    );
    if (!row) throw new Error('409: la suscripción cambió de estado o no existe.');
    await getAdminRepository().appendAudit(
      audit(admin, 'radio.subscription_status_changed', 'radio_channel', row.id, parsed.reason, {
        from: parsed.from,
        to: parsed.to,
      }),
      tx,
    );
    return row;
  });
}
