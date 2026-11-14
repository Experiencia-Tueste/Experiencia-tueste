import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { recordOperationalError } from '@/features/analytics/service';
import { getPendingAdoption, startAdoption } from '@/features/tueste-tree/adoption-order-service';
import { adoptionRequestSchema } from '@/features/tueste-tree/purchase';
import { checkTreeAdoptionRateLimit } from '@/features/tueste-tree/rate-limit';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ROUTE = '/api/tree/adoption';

async function authenticatedUser() {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id || !data.user.email) return null;
  return { id: data.user.id, email: data.user.email };
}

function unauthenticated() {
  return NextResponse.json({ message: 'Inicia sesión para continuar.' }, { status: 401 });
}

function unavailable(requestId: string, operation: string, errorCode: string, message: string) {
  void recordOperationalError({
    requestId,
    route: ROUTE,
    operation,
    status: 503,
    errorCode,
  }).catch(() => undefined);
  return NextResponse.json({ message }, { status: 503, headers: { 'X-Request-Id': requestId } });
}

/** Adopción pendiente de pago del cliente con sesión (o `null`). */
export async function GET() {
  const requestId = randomUUID();
  const user = await authenticatedUser();
  if (!user) return unauthenticated();
  try {
    return NextResponse.json({ adoption: await getPendingAdoption(user) });
  } catch {
    return unavailable(
      requestId,
      'get_pending_adoption',
      'adoption_read_failed',
      'No pudimos consultar tu adopción.',
    );
  }
}

/** Guarda la elección como adopción pendiente y devuelve el enlace de pago de la tienda. */
export async function POST(request: Request) {
  const requestId = randomUUID();
  const user = await authenticatedUser();
  if (!user) return unauthenticated();

  let rateLimit;
  try {
    rateLimit = await checkTreeAdoptionRateLimit(user.id);
  } catch {
    return unavailable(
      requestId,
      'rate_limit',
      'rate_limit_unavailable',
      'No pudimos validar la disponibilidad del servicio. Inténtalo de nuevo.',
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

  const parsed = adoptionRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Revisa los datos de tu adopción.' },
      { status: 400 },
    );
  }

  try {
    const result = await startAdoption(user, parsed.data);
    if (result.status === 'store_unavailable') {
      return NextResponse.json(
        { message: 'La tienda aún no está disponible. Inténtalo más tarde.' },
        { status: 503 },
      );
    }
    return NextResponse.json({ adoption: result.adoption }, { status: 201 });
  } catch {
    return unavailable(
      requestId,
      'start_adoption',
      'adoption_persistence_failed',
      'No pudimos guardar tu adopción. Inténtalo de nuevo.',
    );
  }
}
