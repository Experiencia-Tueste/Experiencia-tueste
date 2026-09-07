import { NextResponse } from 'next/server';
import { recordAnalyticsEvent } from '@/features/analytics/service';

export const dynamic = 'force-dynamic';

/** Endpoint first-party: valida un evento estricto y nunca acepta PII. */
export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 8_192) {
    return NextResponse.json({ message: 'Evento demasiado grande.' }, { status: 413 });
  }

  const input = await request.json().catch(() => null);
  try {
    const result = await recordAnalyticsEvent(input);
    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ message: 'Evento no válido.' }, { status: 400 });
    }
    // La telemetría nunca debe romper la experiencia pública.
    return NextResponse.json({ message: 'Analítica no disponible.' }, { status: 503 });
  }
}
