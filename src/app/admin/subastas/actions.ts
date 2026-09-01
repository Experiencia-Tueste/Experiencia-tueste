'use server';
import { revalidatePath } from 'next/cache';
import {
  changeAuctionStatus,
  createAuction,
  recordAuctionBid,
} from '@/features/admin/operations-service';
const refresh = () => {
  revalidatePath('/admin/subastas');
  revalidatePath('/admin');
};
export async function createAuctionAction(data: FormData) {
  await createAuction(Object.fromEntries(data));
  refresh();
}
export async function changeAuctionStatusAction(data: FormData) {
  await changeAuctionStatus(Object.fromEntries(data));
  refresh();
}
export async function recordAuctionBidAction(data: FormData) {
  await recordAuctionBid(Object.fromEntries(data));
  refresh();
}
