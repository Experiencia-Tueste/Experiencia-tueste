import { describe, expect, it, vi } from 'vitest';

import { publishScheduled } from '../lib/scheduled-publication.mjs';

describe('publicaciones programadas', () => {
  it('publica vencidos, audita y confirma en una sola transacción', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ id: 'content-1' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 'release-1' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });
    const now = new Date('2026-09-01T12:00:00.000Z');

    await expect(publishScheduled({ query }, now)).resolves.toEqual({
      content: 1,
      releases: 1,
    });

    expect(query.mock.calls[0][0]).toBe('BEGIN');
    expect(query.mock.calls.at(-1)[0]).toBe('COMMIT');
    expect(query.mock.calls[1][0]).toContain("status = 'review'");
    expect(query.mock.calls[1][0]).toContain('scheduled_at <= $1');
    expect(query.mock.calls[2][0]).toContain('published_at = $1');
    expect(query.mock.calls[3][1]).toContain('content.published');
    expect(query.mock.calls[4][1]).toContain('release.published');
  });

  it('revierte toda la operación si falla una consulta', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockRejectedValueOnce(new Error('database unavailable'))
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await expect(publishScheduled({ query })).rejects.toThrow('database unavailable');
    expect(query.mock.calls.at(-1)[0]).toBe('ROLLBACK');
  });
});
