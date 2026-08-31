'use server';

import { revalidatePath } from 'next/cache';

import {
  updateAdminIntegration,
  updateAdminSetting,
  upsertCouponReference,
} from '@/features/admin/config-service';

export async function updateSettingAction(formData: FormData) {
  await updateAdminSetting({
    key: formData.get('key'),
    value: formData.get('value'),
    reason: formData.get('reason'),
  });
  revalidatePath('/admin/configuracion');
}

export async function updateIntegrationAction(formData: FormData) {
  await updateAdminIntegration({
    provider: formData.get('provider'),
    label: formData.get('label'),
    status: formData.get('status'),
    publicReference: formData.get('publicReference'),
    reason: formData.get('reason'),
  });
  revalidatePath('/admin/configuracion');
}

export async function upsertCouponAction(formData: FormData) {
  await upsertCouponReference({
    code: formData.get('code'),
    label: formData.get('label'),
    externalId: formData.get('externalId'),
    status: formData.get('status'),
    reason: formData.get('reason'),
  });
  revalidatePath('/admin/configuracion');
}
