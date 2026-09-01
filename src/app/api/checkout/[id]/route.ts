import { getCheckoutOrderForCustomer } from '@/db/payment-repository';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase();
  if (!supabase) return Response.json({ message: 'No autorizado.' }, { status: 401 });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) {
    return Response.json({ message: 'No autorizado.' }, { status: 401 });
  }

  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return Response.json({ message: 'Orden invalida.' }, { status: 400 });
  }

  const order = await getCheckoutOrderForCustomer(id, data.user.id);
  if (!order) return Response.json({ message: 'Orden no encontrada.' }, { status: 404 });

  return Response.json({
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    status: order.status,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
  });
}
