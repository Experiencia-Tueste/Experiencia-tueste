import 'server-only';

import { randomUUID } from 'node:crypto';
import { getEngagementRepository } from '@/db/admin-engagement-repository';
import { getAdminRepository } from '@/db/admin-identity-repository';
import { getDb } from '@/db/client';
import { getCurrentAdmin } from '@/lib/auth/authorization';
import { parseAuditEntry } from '@/features/admin/audit';
import { engagementInputSchema, engagementStatusSchema } from './index';

export async function createEngagementRequest(user: { id: string; email: string }, input: unknown) {
  const parsed = engagementInputSchema.parse(input);
  const requesterName = user.email.split('@')[0] || 'Cliente Tueste';
  return getDb().transaction((tx) =>
    getEngagementRepository().createOrGet(
      {
        ...parsed,
        requesterUserId: user.id,
        requesterEmail: user.email.trim().toLowerCase(),
        requesterName,
      },
      tx,
    ),
  );
}

export async function getEngagementRequests() {
  return getEngagementRepository().list();
}

export async function changeEngagementStatus(input: unknown) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('401: sesión administrativa requerida.');
  if (!admin.capabilities.includes('crm.manage')) throw new Error('403: se requiere crm.manage.');

  const parsed = engagementStatusSchema.parse(input);
  if (parsed.from === parsed.to) throw new Error('400: estado sin cambios.');

  return getDb().transaction(async (tx) => {
    const request = await getEngagementRepository().setStatus(
      parsed.id,
      parsed.from,
      parsed.to,
      tx,
    );
    if (!request) throw new Error('409: la solicitud cambió de estado o no existe.');
    await getAdminRepository().appendAudit(
      parseAuditEntry({
        id: randomUUID(),
        actorUserId: admin.id,
        actorEmail: admin.email,
        action: 'engagement.status_changed',
        targetType: 'engagement_request',
        targetId: request.id,
        occurredAt: new Date().toISOString(),
        reason: parsed.reason,
        metadata: { from: parsed.from, to: parsed.to, type: request.type },
      }),
      tx,
    );
    return request;
  });
}
