import 'server-only';

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { loadDatabaseUrl } from '@/lib/config/admin-database-env';
import * as schema from './schema/admin-identity';

/**
 * Cliente PostgreSQL del panel — estrictamente server-only.
 * ---------------------------------------------------------------------
 * - NO crea conexiones al importar el módulo: el pool se construye de
 *   forma perezosa al llamar `getDb()` desde código de servidor.
 * - Valida que `DATABASE_URL` exista y falla con un error claro sin
 *   incluir su valor.
 * - Sin `NEXT_PUBLIC_*`, sin Supabase client, sin service role.
 * - Ya es consumido por la autorización (identidad RBAC persistente),
 *   la auditoría y el módulo de contenido del panel.
 */

let pool: Pool | null = null;
let db: ReturnType<typeof createDb> | null = null;

function createDb() {
  const databaseUrl = loadDatabaseUrl();
  pool = new Pool({ connectionString: databaseUrl, max: 1 });

  return drizzle(pool, { schema });
}

/** Devuelve el cliente Drizzle, creándolo de forma perezosa. */
export function getDb() {
  if (db === null) {
    db = createDb();
  }
  return db;
}

/** Cierra el pool si fue creado (uso en pruebas/cierre controlado). */
export async function closeDb(): Promise<void> {
  if (pool !== null) {
    await pool.end();
    pool = null;
    db = null;
  }
}
