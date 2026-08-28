import { randomUUID } from 'node:crypto';

import { parseAuditEntry } from './audit';
import type { AuditLogEntry, ContentAuditAction } from './audit';
import type { CurrentAdmin } from './authorization-core';

/**
 * Construcción de entradas de auditoría para operaciones de contenido —
 * lógica pura y testeable.
 *
 * El id y la fecha se generan en la capa de aplicación (no en el
 * contrato); la entrada completa se valida con `parseAuditEntry`
 * (UUIDs, razón obligatoria, metadata segura) antes de persistir.
 */

export interface ContentAuditInput {
  action: ContentAuditAction;
  targetType: string;
  targetId: string;
  reason: string;
  from?: string | null;
  to?: string | null;
  metadata?: Record<string, unknown>;
}

/** Construye y valida una entrada de auditoría con el actor real (admin.id). */
export function buildAuditEntry(
  admin: CurrentAdmin,
  input: ContentAuditInput,
  now?: Date,
): AuditLogEntry {
  return parseAuditEntry({
    id: randomUUID(),
    actorUserId: admin.id,
    // Snapshot del correo del actor (nunca null si se conoce).
    actorEmail: admin.email,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    occurredAt: (now ?? new Date()).toISOString(),
    reason: input.reason,
    metadata: input.metadata ?? {},
  });
}
