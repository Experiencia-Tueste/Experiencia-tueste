'use server';

import { revalidatePath } from 'next/cache';
import {
  changeEngagementStatus,
  changeMarketApplicationStage,
  changeRadioOpportunityStage,
} from '@/features/engagements/service';

export async function changeEngagementStatusAction(data: FormData) {
  await changeEngagementStatus(Object.fromEntries(data));
  revalidatePath('/admin/contactos');
  revalidatePath('/admin');
}

export async function changeRadioOpportunityStageAction(data: FormData) {
  await changeRadioOpportunityStage(Object.fromEntries(data));
  revalidatePath('/admin/contactos');
  revalidatePath('/admin');
}

export async function changeMarketApplicationStageAction(data: FormData) {
  await changeMarketApplicationStage(Object.fromEntries(data));
  revalidatePath('/admin/contactos');
  revalidatePath('/admin');
}
