import { NextResponse } from 'next/server';
import { communityConsentInputSchema } from '@/features/community';
import {
  getCommunityConsent,
  saveCommunityConsent,
  withdrawCommunityConsent,
} from '@/features/community/consent-service';
import { createServerSupabase } from '@/lib/supabase/server';
import { recordOperationalError } from '@/features/analytics/service';
import { checkCommunityConsentRateLimit } from '@/features/community/rate-limit';
import { randomUUID } from 'node:crypto';

export const dynamic = 'force-dynamic';

async function authenticatedUser() {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id || !data.user.email) return null;
  return { id: data.user.id, email: data.user.email };
}

/** `null` si está dentro del límite; una respuesta 429/503 lista para devolver si no. */
async function rateLimitOrNull(userId: string, requestId: string) {
  let rateLimit;
  try {
    rateLimit = await checkCommunityConsentRateLimit(userId);
  } catch {
    void recordOperationalError({
      requestId,
      route: '/api/community/consent',
      operation: 'rate_limit',
      status: 503,
      errorCode: 'rate_limit_unavailable',
    }).catch(() => undefined);
    return NextResponse.json(
      { message: 'No pudimos validar la disponibilidad del servicio. Inténtalo de nuevo.' },
      { status: 503, headers: { 'X-Request-Id': requestId } },
    );
  }
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        message: `Has alcanzado el límite de solicitudes. Inténtalo de nuevo en ${rateLimit.retryAfterSeconds} segundos.`,
      },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
    );
  }
  return null;
}

export async function GET() {
  const user = await authenticatedUser();
  if (!user)
    return NextResponse.json({ message: 'Inicia sesión para continuar.' }, { status: 401 });
  const state = await getCommunityConsent(user.id);
  return NextResponse.json({ state });
}

export async function PUT(request: Request) {
  const requestId = randomUUID();
  const user = await authenticatedUser();
  if (!user)
    return NextResponse.json({ message: 'Inicia sesión para continuar.' }, { status: 401 });
  const rateLimited = await rateLimitOrNull(user.id, requestId);
  if (rateLimited) return rateLimited;
  const parsed = communityConsentInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Revisa tus preferencias y el consentimiento.' },
      { status: 400 },
    );
  }
  try {
    const state = await saveCommunityConsent(user, parsed.data);
    return NextResponse.json({ state });
  } catch {
    void recordOperationalError({
      requestId,
      route: '/api/community/consent',
      operation: 'save_consent',
      status: 503,
      errorCode: 'consent_persistence_failed',
    }).catch(() => undefined);
    return NextResponse.json(
      { message: 'No pudimos actualizar tu consentimiento.' },
      { status: 503, headers: { 'X-Request-Id': requestId } },
    );
  }
}

export async function DELETE() {
  const requestId = randomUUID();
  const user = await authenticatedUser();
  if (!user)
    return NextResponse.json({ message: 'Inicia sesión para continuar.' }, { status: 401 });
  const rateLimited = await rateLimitOrNull(user.id, requestId);
  if (rateLimited) return rateLimited;
  try {
    const state = await withdrawCommunityConsent(user.id);
    return NextResponse.json({ state });
  } catch {
    void recordOperationalError({
      requestId,
      route: '/api/community/consent',
      operation: 'withdraw_consent',
      status: 503,
      errorCode: 'consent_withdraw_failed',
    }).catch(() => undefined);
    return NextResponse.json(
      { message: 'No pudimos retirar tu consentimiento.' },
      { status: 503, headers: { 'X-Request-Id': requestId } },
    );
  }
}
