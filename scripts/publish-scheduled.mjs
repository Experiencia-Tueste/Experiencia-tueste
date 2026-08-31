import { Pool } from 'pg';
import { publishScheduled } from './lib/scheduled-publication.mjs';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL no configurada.');
const pool = new Pool({ connectionString: databaseUrl, max: 1 });
const client = await pool.connect();
try {
  const published = await publishScheduled(client);
  console.log(
    `Publicados automáticamente: ${published.content} contenidos, ${published.releases} lanzamientos.`,
  );
} catch (error) {
  console.error(
    'Falló el job de publicaciones programadas:',
    error instanceof Error ? error.message : 'error desconocido',
  );
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
