import 'server-only';

import { desc, eq, ilike } from 'drizzle-orm';

import { getDb } from './client';
import type { DbClient } from './db-types';
import { adminRoles, adminUserRoles, adminUsers, auditLogs } from './schema/admin-identity';
import { ROLE_CAPABILITIES } from '@/features/admin/permissions';
import type { AdminUser, AdminRole as PersistedAdminRole } from '@/features/admin/identity';
import { assertRoleKey } from './admin-identity-seed';
import type { AuditLogEntry } from '@/features/admin/audit';
import type { AdminIdentityRepository } from '@/features/admin/repository';
import { parseAuditEntry } from '@/features/admin/audit';

/**
 * Implementación real del contrato AdminIdentityRepository con Drizzle
 * sobre las tablas ya migradas (schema `private`).
 *
 * - Server-only: nunca llega al cliente.
 * - Las capacidades de cada rol se derivan del contrato
 *   (`ROLE_CAPABILITIES` por clave), no se duplican en base de datos.
 * - `appendAudit` valida la entrada con `parseAuditEntry` (reason,
 *   metadata segura) antes de insertar: append-only, sin actualizaciones.
 */

function mapStatus(status: string): AdminUser['status'] {
  if (status === 'invited' || status === 'active' || status === 'suspended') {
    return status;
  }
  throw new Error(`admin_users.status inválido en base de datos: «${status}».`);
}

export class DrizzleAdminIdentityRepository implements AdminIdentityRepository {
  private mapUser(row: typeof adminUsers.$inferSelect, roleIds: string[] = []): AdminUser {
    return {
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      status: mapStatus(row.status),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      lastSignedInAt: row.lastSignedInAt?.toISOString(),
      roleIds,
    };
  }

  async findUserByEmail(email: string): Promise<AdminUser | null> {
    const normalized = email.trim().toLowerCase();
    const db = getDb();
    const [row] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, normalized))
      .limit(1);

    if (!row) return null;

    return this.mapUser(row);
  }

  async findUserById(id: string): Promise<AdminUser | null> {
    const db = getDb();
    const [row] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);

    if (!row) return null;

    return this.mapUser(row);
  }

  async listUsers(): Promise<AdminUser[]> {
    const db = getDb();
    const rows = await db.select().from(adminUsers).orderBy(adminUsers.email);
    const assignments = await db.select().from(adminUserRoles);
    const roleIdsByUser = new Map<string, string[]>();
    for (const assignment of assignments) {
      const ids = roleIdsByUser.get(assignment.userId) ?? [];
      ids.push(assignment.roleId);
      roleIdsByUser.set(assignment.userId, ids);
    }
    return rows.map((row) => this.mapUser(row, roleIdsByUser.get(row.id) ?? []));
  }

  async listRoles(): Promise<PersistedAdminRole[]> {
    const db = getDb();
    const rows = await db.select().from(adminRoles).orderBy(adminRoles.key);
    return rows.map((row) => {
      const key = assertRoleKey(row.key);
      return {
        id: row.id,
        key,
        name: row.name,
        description: row.description,
        capabilities: [...ROLE_CAPABILITIES[key]],
      };
    });
  }

  async listAudit(filters: { action?: string; limit?: number } = {}): Promise<AuditLogEntry[]> {
    const db = getDb();
    const limit = Math.min(Math.max(filters.limit ?? 100, 1), 200);
    const rows = await db
      .select()
      .from(auditLogs)
      .where(filters.action ? ilike(auditLogs.action, `%${filters.action}%`) : undefined)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
    return rows.map((row) =>
      parseAuditEntry({
        id: row.id,
        actorUserId: row.actorUserId ?? row.id,
        actorEmail: row.actorEmail ?? undefined,
        action: row.action,
        targetType: row.targetType ?? 'unknown',
        targetId: row.targetId ?? row.id,
        occurredAt: row.createdAt.toISOString(),
        reason: row.reason ?? 'Sin razón registrada',
        metadata: row.metadata,
      }),
    );
  }

  async findRolesByUserId(userId: string): Promise<PersistedAdminRole[]> {
    const db = getDb();
    const rows = await db
      .select({
        id: adminRoles.id,
        key: adminRoles.key,
        name: adminRoles.name,
        description: adminRoles.description,
      })
      .from(adminUserRoles)
      .innerJoin(adminRoles, eq(adminUserRoles.roleId, adminRoles.id))
      .where(eq(adminUserRoles.userId, userId));

    return rows.map((row) => {
      // Cast controlado: `assertRoleKey` valida la clave contra el
      // contrato (ROLE_CAPABILITIES) antes de tiparla; si la BD tuviera
      // una clave desconocida, lanza (fail closed, sin capacidades).
      const key = assertRoleKey(row.key);
      return {
        id: row.id,
        key,
        name: row.name,
        description: row.description,
        // Capacidades derivadas del contrato por clave (sin duplicar en BD).
        capabilities: [...ROLE_CAPABILITIES[key]],
      };
    });
  }

  async appendAudit(entry: AuditLogEntry, tx?: DbClient): Promise<void> {
    // Validación completa antes de persistir: razón obligatoria y
    // metadata estrictamente segura (ciclos, secretos, JSON).
    const valid = parseAuditEntry(entry);

    const db = tx ?? getDb();
    await db.insert(auditLogs).values({
      id: valid.id,
      actorUserId: valid.actorUserId,
      actorEmail: valid.actorEmail ?? null,
      action: valid.action,
      targetType: valid.targetType,
      targetId: valid.targetId,
      reason: valid.reason,
      metadata: valid.metadata,
      createdAt: new Date(valid.occurredAt),
    });
  }
}

/** Fábrica del repositorio de identidad (server-only): crea una instancia
 *  nueva por llamada (sin estado compartido entre operaciones; las
 *  transacciones se pasan explícitamente con `tx`). */
export function getAdminRepository(): DrizzleAdminIdentityRepository {
  return new DrizzleAdminIdentityRepository();
}
