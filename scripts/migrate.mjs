/**
 * Migrador de despliegue (runtime), inspirado en el de Monacua pero
 * adaptado al driver de Tueste (`pg` / node-postgres) y a la imagen
 * standalone de Next.js.
 * ---------------------------------------------------------------------
 * Corre FUERA del bundler de Next: no importa `src/db/client.ts` (lleva
 * `import 'server-only'`, que lanza fuera de un contexto react-server).
 * Abre su propia conexión de un solo uso con `DATABASE_URL` y aplica las
 * migraciones versionadas de `./drizzle`.
 *
 * Uso previsto: `preDeployCommand` del servicio Next en Railway, para que
 * cada despliegue migre la base antes de quedar en vivo. También sirve en
 * local con `DATABASE_URL=... node scripts/migrate.mjs`.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL no está definida.');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
const db = drizzle(pool);

try {
  console.log('Aplicando migraciones...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migraciones aplicadas.');
} catch (err) {
  console.error('Fallo al migrar:', err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
