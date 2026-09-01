import { describe, expect, it } from 'vitest';

import { getVisibleAdminNavigation } from '../navigation';

describe('admin · navegación por capacidades', () => {
  it('siempre incluye el resumen y oculta módulos no autorizados', () => {
    const navigation = getVisibleAdminNavigation(['admin.access', 'content.read']);
    const hrefs = navigation.map((item) => item.href);

    expect(hrefs).toContain('/admin');
    expect(hrefs).toContain('/admin/contenido');
    expect(hrefs).not.toContain('/admin/pedidos');
    expect(hrefs).not.toContain('/admin/usuarios');
  });

  it('permite representar todos los módulos para una cuenta con capacidades completas', () => {
    const all = [
      'admin.access',
      'users.manage',
      'content.read',
      'content.edit',
      'content.review',
      'content.publish',
      'crm.read',
      'crm.manage',
      'crm.export',
      'orders.read',
      'orders.manage',
      'orders.sync',
      'market.read',
      'market.manage',
      'market.self',
      'tree.read',
      'tree.update',
      'tree.export',
      'events.read',
      'events.manage',
      'events.checkin',
      'events.export',
      'unity.read',
      'unity.manage',
      'radio.read',
      'radio.manage',
      'community.read',
      'community.moderate',
      'backstage.read',
      'backstage.manage',
      'auctions.read',
      'auctions.manage',
      'analytics.read',
      'analytics.export',
      'config.manage',
      'audit.read',
    ] as const;

    expect(getVisibleAdminNavigation(all)).toHaveLength(16);
  });
});
