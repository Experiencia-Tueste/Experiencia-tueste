import 'server-only';

import { getAdminConfigRepository } from '@/db/admin-config-repository';
import { DrizzleAdminContentRepository } from '@/db/admin-content-repository';
import { getAdminRepository } from '@/db/admin-identity-repository';
import type { CurrentAdmin } from './authorization-core';
import { ADMIN_SETTING_DEFINITIONS } from './config-schemas';
import { summarizeDashboard } from './dashboard-metrics';

export async function getAdminDashboard(admin: CurrentAdmin) {
  const canManageUsers = admin.capabilities.includes('users.manage');
  const canReadContent = admin.capabilities.includes('content.read');
  const canReadAudit = admin.capabilities.includes('audit.read');
  const canManageConfig = admin.capabilities.includes('config.manage');

  const identityRepository = getAdminRepository();
  const contentRepository = new DrizzleAdminContentRepository();
  const configRepository = getAdminConfigRepository();

  const [users, content, releases, assets, settings, activity] = await Promise.all([
    canManageUsers ? identityRepository.listUsers() : undefined,
    canReadContent ? contentRepository.listContent() : undefined,
    canReadContent ? contentRepository.listReleases() : undefined,
    canReadContent ? contentRepository.listAssets() : undefined,
    canManageConfig ? configRepository.listSettings() : undefined,
    canReadAudit ? identityRepository.listAudit({ limit: 6 }) : undefined,
  ]);

  return summarizeDashboard({
    users,
    content,
    releases,
    assets,
    configuredSettings: settings?.filter((setting) => setting.value.trim().length > 0).length,
    settingDefinitions: canManageConfig ? ADMIN_SETTING_DEFINITIONS.length : undefined,
    activity,
  });
}
