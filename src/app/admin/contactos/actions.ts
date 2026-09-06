'use server';

import { revalidatePath } from 'next/cache';
import { changeEngagementStatus } from '@/features/engagements/service';

export async function changeEngagementStatusAction(data: FormData) {
  await changeEngagementStatus(Object.fromEntries(data));
  revalidatePath('/admin/contactos');
  revalidatePath('/admin');
}
