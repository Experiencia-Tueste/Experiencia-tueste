const SYSTEM_ACTOR_EMAIL = 'system@tueste.local';
const SYSTEM_REASON = 'Publicación programada';

async function appendSystemAudit(client, targetType, id, now) {
  await client.query(
    `INSERT INTO private.audit_logs
      (actor_user_id, actor_email, action, target_type, target_id, reason, metadata, created_at)
     VALUES
      (NULL, $1, $2, $3, $4, $5, $6::jsonb, $7)`,
    [
      SYSTEM_ACTOR_EMAIL,
      `${targetType}.published`,
      targetType,
      id,
      SYSTEM_REASON,
      JSON.stringify({ source: 'scheduled-job' }),
      now,
    ],
  );
}

/**
 * Publica en una sola transacción todos los registros vencidos. El WHERE
 * conserva el estado esperado y hace el job idempotente ante reintentos.
 */
export async function publishScheduled(client, now = new Date()) {
  await client.query('BEGIN');
  try {
    const content = await client.query(
      `UPDATE private.content_entries
       SET status = 'published', published_at = $1, scheduled_at = NULL,
           version = version + 1, updated_at = $1
       WHERE status = 'review' AND scheduled_at IS NOT NULL AND scheduled_at <= $1
       RETURNING id`,
      [now],
    );
    const releases = await client.query(
      `UPDATE private.releases
       SET status = 'published', published_at = $1, scheduled_at = NULL, updated_at = $1
       WHERE status = 'review' AND scheduled_at IS NOT NULL AND scheduled_at <= $1
       RETURNING id`,
      [now],
    );

    for (const row of content.rows) await appendSystemAudit(client, 'content', row.id, now);
    for (const row of releases.rows) await appendSystemAudit(client, 'release', row.id, now);

    await client.query('COMMIT');
    return {
      content: content.rowCount ?? content.rows.length,
      releases: releases.rowCount ?? releases.rows.length,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
