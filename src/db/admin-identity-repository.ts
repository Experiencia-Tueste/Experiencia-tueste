import 'server-only';

import { and, desc, eq, gte, ilike, inArray, lte } from 'drizzle-orm';

import { getDb } from './client';
import type { DbClient } from './db-types';
import {
  adminRoleCapabilities,
  adminRoles,
  adminUserRoles,
  adminUsers,
  auditLogs,
  vendorMemberships,
  vendors,
} from './schema/admin-identity';
import { ALL_CAPABILITIES } from '@/features/admin/permissions';
import type { AdminUser, AdminRole as PersistedAdminRole, Vendor } from '@/features/admin/identity';
import { assertRoleKey } from './admin-identity-seed';
import type { AuditLogEntry } from '@/features/admin/audit';
import type { AdminIdentityRepository, AuditFilters } from '@/features/admin/repository';
import { parseAuditEntry } from '@/features/admin/audit';

/**
 * Implementación real del contrato AdminIdentityRepository con Drizzle
 * sobre las tablas ya migradas (schema `private`).
 *
 * - Server-only: nunca llega al cliente.
 * - Las capacidades se leen de PostgreSQL y se validan contra el
 *   catálogo conocido antes de autorizar (fail closed).
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
  private mapCapabilities(rows: { roleId: string; capability: string }[]) {
    const known = new Set<string>(ALL_CAPABILITIES);
    const byRole = new Map<string, PersistedAdminRole['capabilities']>();
    for (const row of rows) {
      if (!known.has(row.capability)) {
        throw new Error(`Capacidad desconocida persistida: «${row.capability}».`);
      }
      const capabilities = byRole.get(row.roleId) ?? [];
      capabilities.push(row.capability as PersistedAdminRole['capabilities'][number]);
      byRole.set(row.roleId, capabilities);
    }
    return byRole;
  }

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
    const [rows, capabilityRows] = await Promise.all([
      db.select().from(adminRoles).orderBy(adminRoles.key),
      db.select().from(adminRoleCapabilities),
    ]);
    const capabilitiesByRole = this.mapCapabilities(capabilityRows);
    return rows.map((row) => {
      const key = assertRoleKey(row.key);
      return {
        id: row.id,
        key,
        name: row.name,
        description: row.description,
        capabilities: capabilitiesByRole.get(row.id) ?? [],
      };
    });
  }

  async listAudit(filters: AuditFilters = {}): Promise<AuditLogEntry[]> {
    const db = getDb();
    const limit = Math.min(Math.max(filters.limit ?? 100, 1), 200);
    const conditions = [
      filters.action ? ilike(auditLogs.action, `%${filters.action}%`) : undefined,
      filters.actor ? ilike(auditLogs.actorEmail, `%${filters.actor}%`) : undefined,
      filters.targetType ? ilike(auditLogs.targetType, `%${filters.targetType}%`) : undefined,
      filters.from
        ? gte(auditLogs.createdAt, new Date(`${filters.from}T00:00:00.000Z`))
        : undefined,
      filters.to ? lte(auditLogs.createdAt, new Date(`${filters.to}T23:59:59.999Z`)) : undefined,
    ].filter((condition) => condition !== undefined);
    const rows = await db
      .select()
      .from(auditLogs)
      .where(conditions.length ? and(...conditions) : undefined)
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

    const capabilityRows = rows.length
      ? await db
          .select()
          .from(adminRoleCapabilities)
          .where(
            inArray(
              adminRoleCapabilities.roleId,
              rows.map((row) => row.id),
            ),
          )
      : [];
    const capabilitiesByRole = this.mapCapabilities(capabilityRows);

    return rows.map((row) => {
      // Cast controlado: `assertRoleKey` valida la clave contra el
      // catálogo canónico antes de tiparla; si la BD tuviera
      // una clave desconocida, lanza (fail closed, sin capacidades).
      const key = assertRoleKey(row.key);
      return {
        id: row.id,
        key,
        name: row.name,
        description: row.description,
        capabilities: capabilitiesByRole.get(row.id) ?? [],
      };
    });
  }

  async listVendors(): Promise<Vendor[]> {
    const db = getDb();
    const [rows, memberships] = await Promise.all([
      db.select().from(vendors).orderBy(vendors.name),
      db.select().from(vendorMemberships),
    ]);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      status: row.status === 'active' ? 'active' : 'suspended',
      commissionBps: row.commissionBps,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      userIds: memberships.filter((item) => item.vendorId === row.id).map((item) => item.userId),
    }));
  }

  async findVendorByUserId(userId: string): Promise<Vendor | null> {
    const db = getDb();
    const [row] = await db
      .select({ vendor: vendors })
      .from(vendorMemberships)
      .innerJoin(vendors, eq(vendorMemberships.vendorId, vendors.id))
      .where(eq(vendorMemberships.userId, userId))
      .limit(1);
    if (!row) return null;
    return {
      id: row.vendor.id,
      name: row.vendor.name,
      email: row.vendor.email ?? undefined,
      phone: row.vendor.phone ?? undefined,
      status: row.vendor.status === 'active' ? 'active' : 'suspended',
      commissionBps: row.vendor.commissionBps,
      createdAt: row.vendor.createdAt.toISOString(),
      updatedAt: row.vendor.updatedAt.toISOString(),
      userIds: [userId],
    };
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
