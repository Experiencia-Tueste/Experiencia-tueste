import type { AdminUser } from './identity';
import type { AdminRole } from './identity';
import type { AuditLogEntry } from './audit';

/**
 * Puerto de repositorio de identidad admin — SOLO interfaz.
 * ---------------------------------------------------------------------
 * Describe lo que la futura infraestructura PostgreSQL implementará.
 * No hay conexión, cliente, URL, SQL, fetch, Supabase, Prisma, Drizzle
 * ni driver; no hay implementación "in-memory" que pueda confundirse
 * con producción. La implementación real llegará cuando exista
 * PostgreSQL provisionado (Fase 1.2).
 */
export interface AdminIdentityRepository {
  findUserByEmail(email: string): Promise<AdminUser | null>;
  findUserById(id: string): Promise<AdminUser | null>;
  findRolesByUserId(userId: string): Promise<AdminRole[]>;
  appendAudit(entry: AuditLogEntry): Promise<void>;
}
