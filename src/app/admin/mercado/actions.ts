'use server';

import { revalidatePath } from 'next/cache';
import {
  changeMarketListingStatus,
  createMarketListing,
  createVendorListing,
  submitVendorListingForReview,
  updateVendorListing,
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

export async function createVendorListingAction(data: FormData) {
  await createVendorListing(Object.fromEntries(data));
  refresh();
}

export async function updateVendorListingAction(data: FormData) {
  await updateVendorListing(Object.fromEntries(data));
  refresh();
}

export async function submitVendorListingForReviewAction(data: FormData) {
  await submitVendorListingForReview(Object.fromEntries(data));
  refresh();
}
