import 'server-only';

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { resolveAdminRole } from '@/features/admin/authorization-core';
import { hasCapability } from '@/features/admin/permissions';
import type { AdminCapability, AdminRole } from '@/features/admin/permissions';
import { loadAdminConfig } from '@/lib/config/admin-auth-env';

/**
 * Capa de autorización server-only del panel.
 * ---------------------------------------------------------------------
 * Consulta `auth()` de Auth.js en servidor y decide el acceso. En la
 * Fase 1.1 el rol temporal de los correos permitidos es `admin`; en la
 * Fase 1.2 el rol provendrá de la base de datos (User/Role/Permission).
 *
 * Ninguna de estas funciones se usa desde componentes cliente y ninguna
 * filtra datos sensibles (secretos ni allowlist).
 */

export interface CurrentAdmin {
  email: string;
  name: string | null;
  /** Rol temporal de la Fase 1.1 (server-side). */
  role: AdminRole;
}

/** Administrador actual, o null si no hay sesión válida. */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const session = await auth();
  const email = session?.user?.email ?? null;
  const name = session?.user?.name ?? null;
  const config = loadAdminConfig();
  const role = resolveAdminRole(email, config.allowedEmails);

  if (role === null) return null;

  return { email: email as string, name, role };
}

/** Exige sesión de administrador; redirige a /admin/login si no la hay. */
export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (admin === null) {
    redirect('/admin/login');
  }
  return admin;
}

/** Exige sesión Y una capacidad concreta; redirige a acceso denegado. */
export async function requireCapability(capability: AdminCapability): Promise<CurrentAdmin> {
  const admin = await requireAdmin();
  if (!hasCapability(admin.role, capability)) {
    redirect('/admin/acceso-denegado');
  }
  return admin;
}
