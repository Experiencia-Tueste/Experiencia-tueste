'use server';

import { revalidatePath } from 'next/cache';
import {
  changeCommunityMemberStatus,
  changeCommunityPostStatus,
  createCommunityMember,
  createCommunityPost,
  createCommunityReport,
  resolveCommunityReport,
} from '@/features/admin/community-service';

function refresh() {
  revalidatePath('/admin/comunidad');
  revalidatePath('/admin');
}

export async function createMemberAction(data: FormData) {
  await createCommunityMember(Object.fromEntries(data));
  refresh();
}
export async function createPostAction(data: FormData) {
  await createCommunityPost(Object.fromEntries(data));
  refresh();
}
export async function createReportAction(data: FormData) {
  await createCommunityReport(Object.fromEntries(data));
  refresh();
}
export async function changeMemberStatusAction(data: FormData) {
  await changeCommunityMemberStatus(Object.fromEntries(data));
  refresh();
}
export async function changePostStatusAction(data: FormData) {
  await changeCommunityPostStatus(Object.fromEntries(data));
  refresh();
}
export async function resolveReportAction(data: FormData) {
  await resolveCommunityReport(Object.fromEntries(data));
  refresh();
}
