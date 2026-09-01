import { describe, expect, it } from 'vitest';

import { summarizeDashboard } from '../dashboard-metrics';
import type { AssetRow, ContentRow, ReleaseRow } from '../content-types';
import type { AdminUser } from '../identity';

const users = [
  { id: '1', status: 'active' },
  { id: '2', status: 'invited' },
  { id: '3', status: 'suspended' },
] as AdminUser[];

const content = [
  { id: '1', status: 'published', scheduledAt: null },
  { id: '2', status: 'review', scheduledAt: '2026-09-01T12:00:00.000Z' },
] as ContentRow[];

const releases = [
  { id: '1', scheduledAt: '2026-09-02T12:00:00.000Z' },
  { id: '2', scheduledAt: null },
] as ReleaseRow[];

const assets = [
  { id: '1', status: 'pending' },
  { id: '2', status: 'approved' },
] as AssetRow[];

describe('summarizeDashboard', () => {
  it('calcula indicadores desde datos persistidos', () => {
    const result = summarizeDashboard({
      users,
      content,
      releases,
      assets,
      configuredSettings: 3,
      settingDefinitions: 6,
      activity: [],
    });

    expect(result.team).toEqual({ total: 3, active: 1, invited: 1, suspended: 1 });
    expect(result.editorial).toEqual({
      content: 2,
      published: 1,
      releases: 2,
      scheduled: 2,
      pendingAssets: 1,
    });
    expect(result.configuration).toEqual({ configured: 3, total: 6 });
    expect(result.activity).toEqual([]);
  });

  it('no fabrica secciones cuando el administrador no recibió esos datos', () => {
    expect(summarizeDashboard({})).toEqual({
      team: null,
      editorial: null,
      configuration: null,
      activity: null,
    });
  });
});
