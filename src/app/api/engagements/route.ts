import { engagementMessage } from '@/features/engagements';
import { createEngagementRequest } from '@/features/engagements/service';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** La sesión y la identidad se validan aquí, antes de escribir datos privados. */
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  if (!supabase)
    return Response.json({ message: 'Inicia sesión para continuar.' }, { status: 401 });

  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  if (error || !user?.id || !user.email) {
    return Response.json({ message: 'Inicia sesión para continuar.' }, { status: 401 });
  }

  try {
    const result = await createEngagementRequest(
      { id: user.id, email: user.email },
      await request.json().catch(() => null),
    );
    return Response.json({
      message: engagementMessage(result.request.type, result.created),
      created: result.created,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return Response.json({ message: 'Revisa la información de la solicitud.' }, { status: 400 });
    }
    return Response.json(
      { message: 'No pudimos registrar tu solicitud. Inténtalo de nuevo.' },
      { status: 503 },
    );
  }
}
