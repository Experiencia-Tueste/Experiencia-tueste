import { randomUUID } from 'node:crypto';

import { parseAuditEntry } from './audit';
import type { AuditAction } from './audit';
import type { CurrentAdmin } from './authorization-core';

export function buildEventAudit(
  admin: CurrentAdmin,
  input: {
    action: Extract<
      AuditAction,
      'event.created' | 'event.status_changed' | 'event.attendee_registered' | 'event.checked_in'
    >;
    targetType: 'event' | 'event_attendee';
    targetId: string;
    reason: string;
    metadata?: Record<string, unknown>;
  },
) {
  return parseAuditEntry({
    id: randomUUID(),
    actorUserId: admin.id,
    actorEmail: admin.email,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    occurredAt: new Date().toISOString(),
    reason: input.reason,
    metadata: input.metadata ?? {},
  });
}
