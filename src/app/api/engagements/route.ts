import { engagementMessage } from '@/features/engagements';
import {
  createEngagementRequest,
  createPendingEngagementIntent,
  EngagementDomainError,
} from '@/features/engagements/service';
import { engagementInputSchema } from '@/features/engagements';
import {
  PENDING_ENGAGEMENT_COOKIE,
  PENDING_ENGAGEMENT_TTL_SECONDS,
} from '@/features/engagements/pending-intent';
import { checkEngagementRateLimit, requestOrigin } from '@/features/engagements/rate-limit';
import { createServerSupabase } from '@/lib/supabase/server';
import { recordOperationalError } from '@/features/analytics/service';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** La sesión y la identidad se validan aquí, antes de escribir datos privados. */
export async function POST(request: Request) {
  const requestId = randomUUID();
  const supabase = await createServerSupabase();
  if (!supabase)
    return Response.json({ message: 'Inicia sesión para continuar.' }, { status: 401 });

  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  let rateLimit;
  try {
    rateLimit = await checkEngagementRateLimit({
      origin: requestOrigin(request.headers),
      userId: error || !user?.id ? undefined : user.id,
    });
  } catch {
    void recordOperationalError({
      requestId,
      route: '/api/engagements',
      operation: 'rate_limit',
      status: 503,
      errorCode: 'rate_limit_unavailable',
    }).catch(() => undefined);
    return Response.json(
      { message: 'No pudimos validar la disponibilidad del servicio. Inténtalo de nuevo.' },
      { status: 503, headers: { 'X-Request-Id': requestId } },
    );
  }
  if (!rateLimit.allowed) {
    return Response.json(
      {
        message: `Has alcanzado el límite de solicitudes. Inténtalo de nuevo en ${rateLimit.retryAfterSeconds} segundos.`,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const parsedInput = engagementInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsedInput.success) {
    return Response.json({ message: 'Revisa la información de la solicitud.' }, { status: 400 });
  }

  if (error || !user?.id || !user.email) {
    try {
      const token = await createPendingEngagementIntent(parsedInput.data);
      const response = NextResponse.json(
        { message: 'Inicia sesión para continuar.', pending: true },
        { status: 401 },
      );
      response.cookies.set({
        name: PENDING_ENGAGEMENT_COOKIE,
        value: token,
        httpOnly: true,
        sameSite: 'lax',
        secure: new URL(request.url).protocol === 'https:',
        path: '/',
        maxAge: PENDING_ENGAGEMENT_TTL_SECONDS,
      });
      return response;
    } catch {
      void recordOperationalError({
        requestId,
        route: '/api/engagements',
        operation: 'pending_intent',
        status: 503,
        errorCode: 'pending_intent_unavailable',
      }).catch(() => undefined);
      return Response.json(
        { message: 'No pudimos guardar tu solicitud pendiente. Inténtalo de nuevo.' },
        { status: 503, headers: { 'X-Request-Id': requestId } },
      );
    }
  }

  try {
    const result = await createEngagementRequest(
      { id: user.id, email: user.email },
      parsedInput.data,
    );
    return Response.json({
      message: engagementMessage(result.request.type, result.created),
      created: result.created,
    });
  } catch (error) {
    if (error instanceof EngagementDomainError) {
      return Response.json({ message: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return Response.json({ message: 'Revisa la información de la solicitud.' }, { status: 400 });
    }
    void recordOperationalError({
      requestId,
      route: '/api/engagements',
      operation: 'create_engagement',
      status: 503,
      errorCode: 'engagement_persistence_failed',
    }).catch(() => undefined);
    return Response.json(
      { message: 'No pudimos registrar tu solicitud. Inténtalo de nuevo.' },
      { status: 503, headers: { 'X-Request-Id': requestId } },
    );
  }
}
