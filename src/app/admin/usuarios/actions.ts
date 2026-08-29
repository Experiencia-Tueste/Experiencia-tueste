'use server';

import { revalidatePath } from 'next/cache';
import {
  assignAdminRole,
  changeAdminUserStatus,
  inviteAdminUser,
  revokeAdminRole,
} from '@/features/admin/identity-service';

export async function inviteUserAction(formData: FormData) {
  try {
    await inviteAdminUser(
      { email: formData.get('email'), displayName: formData.get('displayName') },
      String(formData.get('reason') ?? ''),
    );
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'No se pudo invitar al usuario.');
  }
  revalidatePath('/admin/usuarios');
}

export async function changeUserStatusAction(formData: FormData) {
  await changeAdminUserStatus({
    userId: String(formData.get('userId') ?? ''),
    status: String(formData.get('status') ?? ''),
    reason: String(formData.get('reason') ?? ''),
  });
  revalidatePath('/admin/usuarios');
}

export async function assignRoleAction(formData: FormData) {
  await assignAdminRole({
    userId: String(formData.get('userId')),
    roleId: String(formData.get('roleId')),
    reason: String(formData.get('reason') ?? ''),
  });
  revalidatePath('/admin/usuarios');
}

export async function revokeRoleAction(formData: FormData) {
  await revokeAdminRole({
    userId: String(formData.get('userId')),
    roleId: String(formData.get('roleId')),
    reason: String(formData.get('reason') ?? ''),
  });
  revalidatePath('/admin/usuarios');
}
