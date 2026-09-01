import type { AdminEventStatus, AttendeeStatus } from './event-schemas';

export type AdminEventRow = {
  id: string;
  title: string;
  slug: string;
  startsAt: string;
  endsAt: string | null;
  city: string;
  venue: string;
  capacity: number | null;
  status: AdminEventStatus;
  createdAt: string;
  updatedAt: string;
};

export type EventAttendeeRow = {
  id: string;
  eventId: string;
  name: string;
  email: string;
  ticketCode: string;
  status: AttendeeStatus;
  checkedInAt: string | null;
  createdAt: string;
};

export type AdminEventWorkspace = AdminEventRow & {
  attendees: EventAttendeeRow[];
  reservedCount: number;
  checkedInCount: number;
};
