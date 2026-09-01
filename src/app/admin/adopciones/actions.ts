'use server';

import { revalidatePath } from 'next/cache';
import { changeTreeAdoptionStatus, createTreeAdoption } from '@/features/admin/operations-service';

const refresh = () => {
  revalidatePath('/admin/adopciones');
  revalidatePath('/admin');
};

export async function createTreeAdoptionAction(data: FormData) {
  await createTreeAdoption(Object.fromEntries(data));
  refresh();
}

export async function changeTreeStatusAction(data: FormData) {
  await changeTreeAdoptionStatus(Object.fromEntries(data));
  refresh();
}
