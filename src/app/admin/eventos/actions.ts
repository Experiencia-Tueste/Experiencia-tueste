'use server';

import { revalidatePath } from 'next/cache';

import {
  checkInEventAttendee,
  createAdminEvent,
  registerEventAttendee,
  transitionAdminEvent,
} from '@/features/admin/event-service';

function refresh() {
  revalidatePath('/admin');
  revalidatePath('/admin/eventos');
}

export async function createEventAction(formData: FormData) {
  await createAdminEvent({
    title: formData.get('title'),
    slug: formData.get('slug'),
    startsAt: formData.get('startsAt'),
    endsAt: String(formData.get('endsAt') ?? '').trim() || undefined,
    city: formData.get('city'),
    venue: formData.get('venue'),
    capacity: String(formData.get('capacity') ?? '').trim() || undefined,
    reason: formData.get('reason'),
  });
  refresh();
}

export async function transitionEventAction(formData: FormData) {
  await transitionAdminEvent({
    id: formData.get('id'),
    from: formData.get('from'),
    to: formData.get('to'),
    reason: formData.get('reason'),
  });
  refresh();
}

export async function registerAttendeeAction(formData: FormData) {
  await registerEventAttendee({
    eventId: formData.get('eventId'),
    name: formData.get('name'),
    email: formData.get('email'),
    reason: formData.get('reason'),
  });
  refresh();
}

export async function checkInAction(formData: FormData) {
  await checkInEventAttendee({
    eventId: formData.get('eventId'),
    ticketCode: formData.get('ticketCode'),
    reason: formData.get('reason'),
  });
  refresh();
}
