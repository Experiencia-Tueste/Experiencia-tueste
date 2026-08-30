import { describe, expect, it } from 'vitest';

import type { AdminUser } from '../identity';
import { isLastActiveOwner } from '../identity-policy';

const ownerRoleId = '11111111-1111-4111-8111-111111111111';

function user(
  id: string,
  status: AdminUser['status'],
  roleIds: string[] = [ownerRoleId],
): AdminUser {
  return {
    id,
    email: `${id}@tueste.test`,
    displayName: id,
    status,
    roleIds,
    createdAt: '2026-08-30T00:00:00.000Z',
    updatedAt: '2026-08-30T00:00:00.000Z',
  };
}

describe('política de continuidad de owners', () => {
  it('protege al único owner activo', () => {
    expect(isLastActiveOwner([user('owner-1', 'active')], ownerRoleId, 'owner-1')).toBe(true);
  });

  it('permite modificar un owner cuando existe otro owner activo', () => {
    const users = [user('owner-1', 'active'), user('owner-2', 'active')];
    expect(isLastActiveOwner(users, ownerRoleId, 'owner-1')).toBe(false);
  });

  it('no cuenta owners suspendidos ni usuarios sin el rol owner', () => {
    const users = [
      user('owner-1', 'active'),
      user('owner-2', 'suspended'),
      user('admin-1', 'active', ['22222222-2222-4222-8222-222222222222']),
    ];
    expect(isLastActiveOwner(users, ownerRoleId, 'owner-1')).toBe(true);
    expect(isLastActiveOwner(users, ownerRoleId, 'admin-1')).toBe(false);
  });
});
