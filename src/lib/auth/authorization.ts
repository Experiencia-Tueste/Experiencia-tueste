import 'server-only';

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { resolvePersistedAdmin } from '@/features/admin/authorization-core';
import type { CurrentAdmin } from '@/features/admin/authorization-core';
import type { AdminCapability } from '@/features/admin/permissions';
import { getAdminRepository } from '@/db/admin-identity-repository';
import { createServerSupabase } from '@/lib/supabase/server';

/**
 * Capa de autorización server-only del panel (Fase 1.2 — RBAC
 * persistente).
 * ---------------------------------------------------------------------
 * `getCurrentAdmin()` obtiene la identidad de Auth.js (Google),
 * normaliza el correo, consulta el usuario y sus roles en PostgreSQL y
 * concede acceso SOLO a usuarios con estado `active` y al menos un rol
 * persistido. Falla cerrada: usuario inexistente, suspendido, sin rol o
 * error de acceso ⇒ null (sin permisos).
 *
 * Ninguna función se usa desde componentes cliente y ninguna filtra
 * secretos, DATABASE_URL ni consultas administrativas.
 */

/** Resuelve un correo ya verificado contra el RBAC persistente. */
export async function getAdminByEmail(
  rawEmail: string | null | undefined,
): Promise<CurrentAdmin | null> {
  const email = rawEmail?.trim().toLowerCase();
  if (!email) return null;

  const repository = getAdminRepository();

  try {
    const user = await repository.findUserByEmail(email);
    if (user === null) return null;
    const roles = await repository.findRolesByUserId(user.id);
    const admin = resolvePersistedAdmin(user, roles);
    return admin === null ? null : { ...admin, id: user.id };
  } catch (error) {
    // Fail closed: un error de PostgreSQL nunca concede acceso. Se
    // registra en servidor un marcador SEGURO para diagnosticar fallos
    // de conexión o configuración: sin DATABASE_URL, mensajes de
    // drivers, tokens, cookies ni sesiones.
    console.error(
      '[admin-auth] fallo al consultar la identidad persistente.',
      error instanceof Error ? error.name : 'unknown',
    );
    return null;
  }
}

/** Administrador actual, o null si no hay sesión o identidad válida. */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  // La puerta pública usa Supabase Auth. getUser() valida la sesión con
  // el servidor de Auth; nunca autorizamos usando getSession() ni
  // metadata editable del usuario.
  const supabase = await createServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user?.email) {
        return getAdminByEmail(data.user.email);
      }
    } catch {
      // Continúa con la sesión administrativa heredada durante la
      // transición. Cualquier fallo termina cerrado más abajo.
    }
  }

  const session = await auth();
  return getAdminByEmail(session?.user?.email);
}

/** Exige sesión de administrador; vuelve a la puerta pública si no la hay. */
export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (admin === null) {
    redirect('/cuenta/iniciar-sesion');
  }
  return admin;
}

/** Exige sesión Y una capacidad concreta (unión de roles); redirige a
 *  acceso denegado si no la tiene. */
export async function requireCapability(capability: AdminCapability): Promise<CurrentAdmin> {
  const admin = await requireAdmin();
  if (!admin.capabilities.includes(capability)) {
    redirect('/admin/acceso-denegado');
  }
  return admin;
}

export type { CurrentAdmin };
