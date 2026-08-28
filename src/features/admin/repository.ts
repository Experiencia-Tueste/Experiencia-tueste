import type { AdminUser } from './identity';
import type { AdminRole } from './identity';
import type { AuditLogEntry } from './audit';

/**
 * Puerto de repositorio de identidad admin — SOLO interfaz.
 * ---------------------------------------------------------------------
 * Contrato que la capa de persistencia implementa. La implementación
 * concreta vive en `src/db/admin-identity-repository.ts` (Drizzle +
 * PostgreSQL, transacciones con `tx`); aquí no hay SQL ni dependencias
 * de infraestructura, y no existe implementación "in-memory" que pueda
 * confundirse con producción.
 */
export interface AdminIdentityRepository {
  findUserByEmail(email: string): Promise<AdminUser | null>;
  findUserById(id: string): Promise<AdminUser | null>;
  findRolesByUserId(userId: string): Promise<AdminRole[]>;
  appendAudit(entry: AuditLogEntry): Promise<void>;
}
