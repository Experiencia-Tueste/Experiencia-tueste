'use server';
import { revalidatePath } from 'next/cache';
import {
  changeRadioSubscriptionStatus,
  createRadioChannel,
  createRadioCompany,
} from '@/features/admin/radio-service';
const refresh = () => {
  revalidatePath('/admin/radio');
  revalidatePath('/admin');
};
export async function createCompanyAction(data: FormData) {
  await createRadioCompany(Object.fromEntries(data));
  refresh();
}
export async function createChannelAction(data: FormData) {
  await createRadioChannel(Object.fromEntries(data));
  refresh();
}
export async function changeSubscriptionAction(data: FormData) {
  await changeRadioSubscriptionStatus(Object.fromEntries(data));
  refresh();
}
