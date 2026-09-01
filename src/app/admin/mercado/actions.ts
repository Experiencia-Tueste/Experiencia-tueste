'use server';

import { revalidatePath } from 'next/cache';
import {
  changeMarketListingStatus,
  createMarketListing,
} from '@/features/admin/operations-service';

const refresh = () => {
  revalidatePath('/admin/mercado');
  revalidatePath('/admin');
};

export async function createMarketListingAction(data: FormData) {
  await createMarketListing(Object.fromEntries(data));
  refresh();
}
export async function changeMarketStatusAction(data: FormData) {
  await changeMarketListingStatus(Object.fromEntries(data));
  refresh();
}
