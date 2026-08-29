import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL no configurada.');
const pool = new Pool({ connectionString: databaseUrl, max: 1 });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const now = new Date();
  const content = await client.query(
    `UPDATE private.content_entries SET status = 'published', published_at = $1, scheduled_at = NULL, version = version + 1, updated_at = $1 WHERE status = 'review' AND scheduled_at IS NOT NULL AND scheduled_at <= $1 RETURNING id`,
    [now],
  );
  const releases = await client.query(
    `UPDATE private.releases SET status = 'published', scheduled_at = NULL, updated_at = $1 WHERE status = 'review' AND scheduled_at IS NOT NULL AND scheduled_at <= $1 RETURNING id`,
    [now],
  );
  for (const row of content.rows)
    await client.query(
      `INSERT INTO private.audit_logs (actor_user_id, actor_email, action, target_type, target_id, reason, metadata, created_at) VALUES (NULL, 'system@tueste.local', 'content.published', 'content', $1, 'Publicación programada', $2::jsonb, $3)`,
      [row.id, JSON.stringify({ source: 'scheduled-job' }), now],
    );
  for (const row of releases.rows)
    await client.query(
      `INSERT INTO private.audit_logs (actor_user_id, actor_email, action, target_type, target_id, reason, metadata, created_at) VALUES (NULL, 'system@tueste.local', 'release.published', 'release', $1, 'Publicación programada', $2::jsonb, $3)`,
      [row.id, JSON.stringify({ source: 'scheduled-job' }), now],
    );
  await client.query('COMMIT');
  console.log(
    `Publicados automáticamente: ${content.rowCount ?? 0} contenidos, ${releases.rowCount ?? 0} lanzamientos.`,
  );
} catch (error) {
  await client.query('ROLLBACK');
  console.error(
    'Falló el job de publicaciones programadas:',
    error instanceof Error ? error.message : 'error desconocido',
  );
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
