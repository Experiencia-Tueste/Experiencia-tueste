import type { AdminUser } from './identity';

/**
 * Protege la continuidad operativa del panel: siempre debe quedar al
 * menos un owner activo. La política es pura para poder probarla sin BD.
 */
export function isLastActiveOwner(
  users: readonly AdminUser[],
  ownerRoleId: string,
  targetUserId: string,
): boolean {
  const target = users.find((user) => user.id === targetUserId);
  if (!target || target.status !== 'active' || !target.roleIds.includes(ownerRoleId)) return false;

  return (
    users.filter((user) => user.status === 'active' && user.roleIds.includes(ownerRoleId))
      .length === 1
  );
}
