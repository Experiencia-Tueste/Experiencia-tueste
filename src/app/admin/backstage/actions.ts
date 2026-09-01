'use server';
import { revalidatePath } from 'next/cache';
import {
  changeBackstagePassStatus,
  createBackstagePass,
} from '@/features/admin/operations-service';
const refresh = () => {
  revalidatePath('/admin/backstage');
  revalidatePath('/admin');
};
export async function createBackstagePassAction(data: FormData) {
  await createBackstagePass(Object.fromEntries(data));
  refresh();
}
export async function changeBackstageStatusAction(data: FormData) {
  await changeBackstagePassStatus(Object.fromEntries(data));
  refresh();
}
