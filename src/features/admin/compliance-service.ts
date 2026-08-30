import 'server-only';

import { randomUUID } from 'node:crypto';
import { getAdminComplianceRepository } from '@/db/admin-compliance-repository';
import { getAdminRepository } from '@/db/admin-identity-repository';
import { getDb } from '@/db/client';
import { getCurrentAdmin } from '@/lib/auth/authorization';
import type { CurrentAdmin } from './authorization-core';
import { parseAuditEntry } from './audit';
import {
  COMPLIANCE_RECORD_SCHEMA,
  COMPLIANCE_STATUS_SCHEMA,
  FARM_LOT_SCHEMA,
  FARM_SCHEMA,
} from './compliance-schemas';

function assertRead(admin: CurrentAdmin) {
  if (!admin.capabilities.includes('tree.read')) throw new Error('403: se requiere tree.read.');
}

async function requireUpdate() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('401: sesión administrativa requerida.');
  if (!admin.capabilities.includes('tree.update')) throw new Error('403: se requiere tree.update.');
  return admin;
}

function audit(
  admin: CurrentAdmin,
  action: 'farm.created' | 'farm.lot_created' | 'compliance.created' | 'compliance.status_changed',
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

export async function getComplianceWorkspace(admin: CurrentAdmin) {
  assertRead(admin);
  return getAdminComplianceRepository().workspace();
}

export async function createFarm(input: unknown) {
  const admin = await requireUpdate();
  const parsed = FARM_SCHEMA.parse(input);
  return getDb().transaction(async (tx) => {
    const row = await getAdminComplianceRepository().createFarm(
      { ...parsed, actorId: admin.id },
      tx,
    );
    await getAdminRepository().appendAudit(
      audit(admin, 'farm.created', 'farm', row.id, parsed.reason, {
        city: row.city,
        region: row.region,
      }),
      tx,
    );
    return row;
  });
}

export async function createFarmLot(input: unknown) {
  const admin = await requireUpdate();
  const parsed = FARM_LOT_SCHEMA.parse(input);
  return getDb().transaction(async (tx) => {
    const row = await getAdminComplianceRepository().createLot(
      { ...parsed, actorId: admin.id },
      tx,
    );
    await getAdminRepository().appendAudit(
      audit(admin, 'farm.lot_created', 'farm_lot', row.id, parsed.reason, {
        farmId: row.farmId,
        code: row.code,
      }),
      tx,
    );
    return row;
  });
}

export async function createComplianceRecord(input: unknown) {
  const admin = await requireUpdate();
  const parsed = COMPLIANCE_RECORD_SCHEMA.parse(input);
  return getDb().transaction(async (tx) => {
    const repository = getAdminComplianceRepository();
    if (parsed.lotId) {
      const lot = await repository.findLot(parsed.lotId, tx);
      if (!lot || lot.farmId !== parsed.farmId) {
        throw new Error('400: el lote no pertenece a la finca seleccionada.');
      }
    }
    const row = await repository.createRecord({ ...parsed, actorId: admin.id }, tx);
    await getAdminRepository().appendAudit(
      audit(admin, 'compliance.created', 'compliance_record', row.id, parsed.reason, {
        farmId: row.farmId,
        kind: row.kind,
      }),
      tx,
    );
    return row;
  });
}

export async function changeComplianceStatus(input: unknown) {
  const admin = await requireUpdate();
  const parsed = COMPLIANCE_STATUS_SCHEMA.parse(input);
  return getDb().transaction(async (tx) => {
    const row = await getAdminComplianceRepository().setRecordStatus(parsed.id, parsed.status, tx);
    if (!row) throw new Error('404: registro no encontrado.');
    await getAdminRepository().appendAudit(
      audit(admin, 'compliance.status_changed', 'compliance_record', row.id, parsed.reason, {
        status: parsed.status,
      }),
      tx,
    );
    return row;
  });
}
