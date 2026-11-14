import { NextResponse } from 'next/server';

import { getEventWorkspace } from '@/features/admin/event-service';
import { EVENT_FILTER_SCHEMA } from '@/features/admin/event-schemas';
import { requireCapability } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const admin = await requireCapability('events.export');
  const url = new URL(request.url);
  const filters = EVENT_FILTER_SCHEMA.parse({
    status: url.searchParams.get('status') ?? undefined,
    city: url.searchParams.get('city') ?? undefined,
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
  });
  const events = await getEventWorkspace(admin, filters);
  const rows = [
    ['evento', 'ciudad', 'inicio', 'estado', 'asistente', 'correo', 'ticket', 'estado_asistente'],
    ...events.flatMap((event) =>
      event.attendees.map((attendee) => [
        event.title,
        event.city,
        event.startsAt,
        event.status,
        attendee.name,
        attendee.email,
        attendee.ticketCode,
        attendee.status,
      ]),
    ),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
  return new NextResponse(`\uFEFF${csv}\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="tueste-eventos-asistentes.csv"',
      'Cache-Control': 'private, no-store',
    },
  });
}

function csvCell(value: string) {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
