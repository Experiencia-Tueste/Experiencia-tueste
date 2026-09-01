import type { AuditLogEntry } from './audit';
import type { AssetRow, ContentRow, ReleaseRow } from './content-types';
import type { AdminUser } from './identity';

export type DashboardMetrics = {
  team: {
    total: number;
    active: number;
    invited: number;
    suspended: number;
  } | null;
  editorial: {
    content: number;
    published: number;
    releases: number;
    scheduled: number;
    pendingAssets: number;
  } | null;
  configuration: {
    configured: number;
    total: number;
  } | null;
  activity: AuditLogEntry[] | null;
};

type DashboardSources = {
  users?: AdminUser[];
  content?: ContentRow[];
  releases?: ReleaseRow[];
  assets?: AssetRow[];
  configuredSettings?: number;
  settingDefinitions?: number;
  activity?: AuditLogEntry[];
};

/** Resume únicamente datos persistidos que el servicio ya autorizó. */
export function summarizeDashboard(sources: DashboardSources): DashboardMetrics {
  const team = sources.users
    ? {
        total: sources.users.length,
        active: sources.users.filter((user) => user.status === 'active').length,
        invited: sources.users.filter((user) => user.status === 'invited').length,
        suspended: sources.users.filter((user) => user.status === 'suspended').length,
      }
    : null;

  const editorial =
    sources.content && sources.releases && sources.assets
      ? {
          content: sources.content.length,
          published: sources.content.filter((entry) => entry.status === 'published').length,
          releases: sources.releases.length,
          scheduled:
            sources.content.filter((entry) => entry.scheduledAt).length +
            sources.releases.filter((release) => release.scheduledAt).length,
          pendingAssets: sources.assets.filter((asset) => asset.status === 'pending').length,
        }
      : null;

  const configuration =
    sources.configuredSettings === undefined || sources.settingDefinitions === undefined
      ? null
      : {
          configured: sources.configuredSettings,
          total: sources.settingDefinitions,
        };

  return {
    team,
    editorial,
    configuration,
    activity: sources.activity ?? null,
  };
}
