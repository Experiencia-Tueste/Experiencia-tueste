'use server';

import { revalidatePath } from 'next/cache';

import { updateAdminSetting } from '@/features/admin/config-service';

export async function updateSettingAction(formData: FormData) {
  await updateAdminSetting({
    key: formData.get('key'),
    value: formData.get('value'),
    reason: formData.get('reason'),
  });
  revalidatePath('/admin/configuracion');
}
