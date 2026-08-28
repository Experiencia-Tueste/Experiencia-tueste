#!/usr/bin/env node
/**
 * Bootstrap idempotente del panel administrativo.
 * ---------------------------------------------------------------------
 * - Inserta los seis roles iniciales (fuente única: admin-roles.mjs).
 * - Crea el primer administrador (ADMIN_BOOTSTRAP_EMAIL, estado active)
 *   y le asigna el rol `owner`.
 * - NO se ejecuta automáticamente: requiere ADMIN_BOOTSTRAP_EMAIL.
 * - Nunca imprime secretos ni valores de DATABASE_URL.
 *
 * Uso (desde tueste-app-admin):
 *   ADMIN_BOOTSTRAP_EMAIL=correo@tueste.co npm run db:bootstrap
 *
 * Idempotente: puede ejecutarse varias veces sin duplicar datos.
 */
import pg from 'pg';

import { ADMIN_ROLES_META } from '../src/db/admin-roles.mjs';

const { Pool } = pg;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.trim() === '') {
    throw new Error('DATABASE_URL no está definida (configúrala solo en .env.local).');
  }

  const bootstrapEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL ?? '').trim().toLowerCase();
  if (bootstrapEmail === '') {
    throw new Error(
      'ADMIN_BOOTSTRAP_EMAIL es obligatorio para el bootstrap: define el correo del primer administrador.',
    );
  }

  const pool = new Pool({ connectionString: databaseUrl, max: 1 });

  try {
    await pool.query('BEGIN');

    // Roles iniciales (idempotente por key única).
    for (const { key, name, description } of ADMIN_ROLES_META) {
      await pool.query(
        `INSERT INTO private.admin_roles (id, key, name, description, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, now())
         ON CONFLICT (key) DO NOTHING`,
        [key, name, description],
      );
    }

    // Primer administrador (idempotente por email único).
    await pool.query(
      `INSERT INTO private.admin_users (id, email, display_name, status, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $1, 'active', now(), now())
       ON CONFLICT (email) DO NOTHING`,
      [bootstrapEmail],
    );

    // Asignación owner (idempotente por clave primaria compuesta).
    await pool.query(
      `INSERT INTO private.admin_user_roles (user_id, role_id, created_at)
       SELECT u.id, r.id, now()
       FROM private.admin_users u
       JOIN private.admin_roles r ON r.key = 'owner'
       WHERE u.email = $1
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [bootstrapEmail],
    );

    await pool.query('COMMIT');
    console.log(`Bootstrap completado para ${bootstrapEmail} (roles y admin listos).`);
  } catch (error) {
    await pool.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`Bootstrap falló: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
