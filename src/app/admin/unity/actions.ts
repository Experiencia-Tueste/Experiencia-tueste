'use server';
import { revalidatePath } from 'next/cache';
import {
  changeUnityOpportunityStage,
  createUnityOpportunity,
} from '@/features/admin/operations-service';
const refresh = () => {
  revalidatePath('/admin/unity');
  revalidatePath('/admin');
};
export async function createUnityOpportunityAction(data: FormData) {
  await createUnityOpportunity(Object.fromEntries(data));
  refresh();
}
export async function changeUnityStageAction(data: FormData) {
  await changeUnityOpportunityStage(Object.fromEntries(data));
  refresh();
}
