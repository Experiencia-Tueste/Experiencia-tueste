'use server';
import { revalidatePath } from 'next/cache';
import {
  changeComplianceStatus,
  createComplianceRecord,
  createFarm,
  createFarmLot,
} from '@/features/admin/compliance-service';

const refresh = () => {
  revalidatePath('/admin/cumplimiento');
  revalidatePath('/admin');
};
export async function createFarmAction(data: FormData) {
  await createFarm(Object.fromEntries(data));
  refresh();
}
export async function createLotAction(data: FormData) {
  await createFarmLot(Object.fromEntries(data));
  refresh();
}
export async function createRecordAction(data: FormData) {
  await createComplianceRecord(Object.fromEntries(data));
  refresh();
}
export async function changeRecordStatusAction(data: FormData) {
  await changeComplianceStatus(Object.fromEntries(data));
  refresh();
}
