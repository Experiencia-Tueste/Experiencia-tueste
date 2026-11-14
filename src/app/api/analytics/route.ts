import { NextResponse } from 'next/server';
import { recordAnalyticsEvent } from '@/features/analytics/service';
import { checkAnalyticsRateLimit } from '@/features/analytics/rate-limit';
import { requestOrigin } from '@/features/engagements/rate-limit';

export const dynamic = 'force-dynamic';

/** Endpoint first-party: valida un evento estricto y nunca acepta PII. */
export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 8_192) {
    return NextResponse.json({ message: 'Evento demasiado grande.' }, { status: 413 });
  }

  let rateLimit;
  try {
    rateLimit = await checkAnalyticsRateLimit(requestOrigin(request.headers));
  } catch {
    // Falla cerrado: si el bucket no está disponible, no se escribe el evento.
    return NextResponse.json({ message: 'Analítica no disponible.' }, { status: 503 });
  }
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: 'Demasiados eventos desde este origen. Inténtalo más tarde.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
    );
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
