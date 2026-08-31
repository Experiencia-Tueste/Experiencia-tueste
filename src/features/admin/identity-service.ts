import 'server-only';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { getAdminRepository } from '@/db/admin-identity-repository';
import {
  adminRoleCapabilities,
  adminUserRoles,
  adminUsers,
  vendorMemberships,
  vendors,
} from '@/db/schema/admin-identity';
import { requireCapability } from '@/lib/auth/authorization';
import { parseAuditEntry } from './audit';
import { isLastActiveOwner } from './identity-policy';
import { ALL_CAPABILITIES } from './permissions';

const userInput = z.object({
  email: z.string().trim().toLowerCase().email(),
  displayName: z.string().trim().min(1).max(120),
});
const statusInput = z.object({
  userId: z.string().uuid(),
  status: z.enum(['invited', 'active', 'suspended']),
  reason: z.string().trim().min(3).max(300),
});
const roleInput = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  reason: z.string().trim().min(3).max(300),
});
const roleCapabilitiesInput = z.object({
  roleId: z.string().uuid(),
  capabilities: z.array(z.string()).max(ALL_CAPABILITIES.length),
  reason: z.string().trim().min(3).max(300),
});
const vendorInput = z.object({
  userId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  email: z.union([z.string().trim().toLowerCase().email(), z.literal('')]).optional(),
  phone: z.string().trim().max(40).optional(),
  commissionPercent: z.coerce.number().min(0).max(100),
  reason: z.string().trim().min(3).max(300),
});
const vendorUpdateInput = z.object({
  vendorId: z.string().uuid(),
  status: z.enum(['active', 'suspended']),
  commissionPercent: z.coerce.number().min(0).max(100),
  reason: z.string().trim().min(3).max(300),
});

function audit(
  admin: Awaited<ReturnType<typeof requireUsersManager>>,
  input: {
    action: 'user.invited' | 'user.activated' | 'user.suspended';
    targetId: string;
    reason: string;
    metadata: Record<string, unknown>;
  },
) {
  return parseAuditEntry({
    id: randomUUID(),
    actorUserId: admin.id,
    actorEmail: admin.email,
    action: input.action,
    targetType: 'admin_user',
    targetId: input.targetId,
    occurredAt: new Date().toISOString(),
    reason: input.reason,
    metadata: input.metadata,
  });
}

async function requireUsersManager() {
  return requireCapability('users.manage');
}

export async function listAdminUsers() {
  const admin = await requireUsersManager();
  const repository = getAdminRepository();
  const [users, roles, vendorList] = await Promise.all([
    repository.listUsers(),
    repository.listRoles(),
    repository.listVendors(),
  ]);
  return { admin, users, roles, vendors: vendorList, capabilities: ALL_CAPABILITIES };
}

export async function inviteAdminUser(input: unknown, reason: string) {
  const admin = await requireUsersManager();
  const parsed = userInput.parse(input);
  const safeReason = z.string().trim().min(3).max(300).parse(reason);
  const repository = getAdminRepository();
  const existing = await repository.findUserByEmail(parsed.email);
  if (existing) throw new Error('409: ese correo ya está registrado.');
  const id = randomUUID();
  return getDb().transaction(async (tx) => {
    await tx
      .insert(adminUsers)
      .values({ id, email: parsed.email, displayName: parsed.displayName, status: 'invited' });
    await repository.appendAudit(
      audit(admin, {
        action: 'user.invited',
        targetId: id,
        reason: safeReason,
        metadata: { email: parsed.email },
      }),
      tx,
    );
    revalidatePath('/admin/usuarios');
    return { ok: true as const };
  });
}

export async function changeAdminUserStatus(input: unknown) {
  const admin = await requireUsersManager();
  const parsed = statusInput.parse(input);
  if (parsed.userId === admin.id)
    throw new Error('400: no puedes cambiar tu propio estado desde este panel.');
  const repository = getAdminRepository();
  const [users, roles] = await Promise.all([repository.listUsers(), repository.listRoles()]);
  const target = users.find((user) => user.id === parsed.userId);
  if (!target) throw new Error('404: usuario no encontrado.');
  if (target.status === parsed.status) return { ok: true as const };
  const ownerRole = roles.find((role) => role.key === 'owner');
  if (
    parsed.status !== 'active' &&
    ownerRole &&
    isLastActiveOwner(users, ownerRole.id, parsed.userId)
  ) {
    throw new Error('409: debe quedar al menos un owner activo.');
  }
  const action =
    parsed.status === 'active'
      ? 'user.activated'
      : parsed.status === 'suspended'
        ? 'user.suspended'
        : 'user.invited';
  return getDb().transaction(async (tx) => {
    const updated = await tx
      .update(adminUsers)
      .set({ status: parsed.status, updatedAt: new Date() })
      .where(eq(adminUsers.id, parsed.userId))
      .returning({ id: adminUsers.id });
    if (updated.length === 0) throw new Error('409: el usuario cambió mientras se guardaba.');
    if (action === 'user.invited' || action === 'user.activated' || action === 'user.suspended') {
      await getAdminRepository().appendAudit(
        audit(admin, {
          action,
          targetId: parsed.userId,
          reason: parsed.reason,
          metadata: { from: target.status, to: parsed.status },
        }),
        tx,
      );
    }
    revalidatePath('/admin/usuarios');
    return { ok: true as const };
  });
}

export async function assignAdminRole(input: unknown) {
  const admin = await requireUsersManager();
  const parsed = roleInput.parse(input);
  const repository = getAdminRepository();
  const users = await repository.listUsers();
  const target = users.find((user) => user.id === parsed.userId);
  if (!target) throw new Error('404: usuario no encontrado.');
  const roles = repository.listRoles ? await repository.listRoles() : [];
  const role = roles.find((item) => item.id === parsed.roleId);
  if (!role) throw new Error('404: rol no encontrado.');
  if (target.roleIds.includes(parsed.roleId)) {
    throw new Error('409: el usuario ya tiene ese rol.');
  }
  if (role.key === 'vendedor') {
    throw new Error('409: vincula el usuario desde la sección Vendedores para asignar este rol.');
  }
  return getDb().transaction(async (tx) => {
    await tx
      .insert(adminUserRoles)
      .values({ userId: parsed.userId, roleId: parsed.roleId })
      .onConflictDoNothing();
    await getAdminRepository().appendAudit(
      parseAuditEntry({
        id: randomUUID(),
        actorUserId: admin.id,
        actorEmail: admin.email,
        action: 'role.assigned',
        targetType: 'admin_user',
        targetId: parsed.userId,
        occurredAt: new Date().toISOString(),
        reason: parsed.reason,
        metadata: { role: role.key },
      }),
      tx,
    );
    revalidatePath('/admin/usuarios');
    return { ok: true as const };
  });
}

/** Cambia las capacidades efectivas de un rol no propietario. */
export async function updateRoleCapabilities(input: unknown) {
  const admin = await requireUsersManager();
  const parsed = roleCapabilitiesInput.parse(input);
  const repository = getAdminRepository();
  const role = (await repository.listRoles()).find((item) => item.id === parsed.roleId);
  if (!role) throw new Error('404: rol no encontrado.');
  if (role.key === 'owner') throw new Error('409: las capacidades de owner son inmutables.');

  const known = new Set<string>(ALL_CAPABILITIES);
  const capabilities = Array.from(new Set(parsed.capabilities));
  if (capabilities.some((capability) => !known.has(capability))) {
    throw new Error('400: se recibió una capacidad desconocida.');
  }
  if (!capabilities.includes('admin.access')) {
    throw new Error('400: todo rol del panel debe conservar admin.access.');
  }

  return getDb().transaction(async (tx) => {
    await tx.delete(adminRoleCapabilities).where(eq(adminRoleCapabilities.roleId, role.id));
    await tx
      .insert(adminRoleCapabilities)
      .values(capabilities.map((capability) => ({ roleId: role.id, capability })));
    await repository.appendAudit(
      parseAuditEntry({
        id: randomUUID(),
        actorUserId: admin.id,
        actorEmail: admin.email,
        action: 'role.capabilities_updated',
        targetType: 'admin_role',
        targetId: role.id,
        occurredAt: new Date().toISOString(),
        reason: parsed.reason,
        metadata: { role: role.key, capabilities },
      }),
      tx,
    );
    revalidatePath('/admin/usuarios');
    return { ok: true as const };
  });
}

/** Crea el alcance vendedor, lo vincula a una identidad y asigna el rol. */
export async function createVendorMembership(input: unknown) {
  const admin = await requireUsersManager();
  const parsed = vendorInput.parse(input);
  const repository = getAdminRepository();
  const [users, roles, currentVendor] = await Promise.all([
    repository.listUsers(),
    repository.listRoles(),
    repository.findVendorByUserId(parsed.userId),
  ]);
  const user = users.find((item) => item.id === parsed.userId);
  if (!user) throw new Error('404: usuario no encontrado.');
  if (currentVendor) throw new Error('409: ese usuario ya está vinculado a un vendedor.');
  const sellerRole = roles.find((item) => item.key === 'vendedor');
  if (!sellerRole) throw new Error('409: falta el rol vendedor en la base de datos.');
  const vendorId = randomUUID();
  const commissionBps = Math.round(parsed.commissionPercent * 100);

  return getDb().transaction(async (tx) => {
    await tx.insert(vendors).values({
      id: vendorId,
      name: parsed.name,
      email: parsed.email || null,
      phone: parsed.phone || null,
      commissionBps,
      status: 'active',
      createdBy: admin.id,
    });
    await tx.insert(vendorMemberships).values({
      vendorId,
      userId: user.id,
      createdBy: admin.id,
    });
    await tx
      .insert(adminUserRoles)
      .values({ userId: user.id, roleId: sellerRole.id })
      .onConflictDoNothing();
    await repository.appendAudit(
      parseAuditEntry({
        id: randomUUID(),
        actorUserId: admin.id,
        actorEmail: admin.email,
        action: 'vendor.created',
        targetType: 'vendor',
        targetId: vendorId,
        occurredAt: new Date().toISOString(),
        reason: parsed.reason,
        metadata: { userId: user.id, commissionBps },
      }),
      tx,
    );
    revalidatePath('/admin/usuarios');
    return { ok: true as const };
  });
}

export async function updateVendor(input: unknown) {
  const admin = await requireUsersManager();
  const parsed = vendorUpdateInput.parse(input);
  const repository = getAdminRepository();
  const vendor = (await repository.listVendors()).find((item) => item.id === parsed.vendorId);
  if (!vendor) throw new Error('404: vendedor no encontrado.');
  const commissionBps = Math.round(parsed.commissionPercent * 100);

  return getDb().transaction(async (tx) => {
    await tx
      .update(vendors)
      .set({ status: parsed.status, commissionBps, updatedAt: new Date() })
      .where(eq(vendors.id, vendor.id));
    await repository.appendAudit(
      parseAuditEntry({
        id: randomUUID(),
        actorUserId: admin.id,
        actorEmail: admin.email,
        action: 'vendor.updated',
        targetType: 'vendor',
        targetId: vendor.id,
        occurredAt: new Date().toISOString(),
        reason: parsed.reason,
        metadata: {
          status: { from: vendor.status, to: parsed.status },
          commissionBps: { from: vendor.commissionBps, to: commissionBps },
        },
      }),
      tx,
    );
    revalidatePath('/admin/usuarios');
    return { ok: true as const };
  });
}

export async function revokeAdminRole(input: unknown) {
  const admin = await requireUsersManager();
  const parsed = roleInput.parse(input);
  if (parsed.userId === admin.id) throw new Error('400: no puedes quitarte roles a ti mismo.');
  const repository = getAdminRepository();
  const [roles, users] = await Promise.all([repository.listRoles(), repository.listUsers()]);
  const role = roles.find((item) => item.id === parsed.roleId);
  if (!role) throw new Error('404: rol no encontrado.');
  if (role.key === 'owner' && isLastActiveOwner(users, role.id, parsed.userId)) {
    throw new Error('409: debe quedar al menos un owner activo.');
  }
  return getDb().transaction(async (tx) => {
    const deleted = await tx
      .delete(adminUserRoles)
      .where(
        and(eq(adminUserRoles.userId, parsed.userId), eq(adminUserRoles.roleId, parsed.roleId)),
      )
      .returning({ userId: adminUserRoles.userId });
    if (deleted.length === 0) throw new Error('409: el rol ya no estaba asignado.');
    await getAdminRepository().appendAudit(
      parseAuditEntry({
        id: randomUUID(),
        actorUserId: admin.id,
        actorEmail: admin.email,
        action: 'role.revoked',
        targetType: 'admin_user',
        targetId: parsed.userId,
        occurredAt: new Date().toISOString(),
        reason: parsed.reason,
        metadata: { role: role.key },
      }),
      tx,
    );
    revalidatePath('/admin/usuarios');
    return { ok: true as const };
  });
}
