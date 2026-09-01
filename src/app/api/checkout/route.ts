import { createOrGetCheckoutOrder } from '@/db/payment-repository';
import { getProduct } from '@/features/commerce';
import { checkoutRequestSchema } from '@/features/payments/schemas';
import { loadPaymentsServiceConfig } from '@/lib/config/payments-env';
import { createPaymentCheckout, PaymentServiceError } from '@/lib/payments/payment-service-client';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const paymentsConfig = loadPaymentsServiceConfig();
  if (!paymentsConfig) {
    return Response.json(
      { message: 'El checkout esta temporalmente en configuracion.' },
      { status: 503 },
    );
  }

  const supabase = await createServerSupabase();
  if (!supabase) return Response.json({ message: 'Inicia sesion para pagar.' }, { status: 401 });

  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  if (error || !user?.id || !user.email) {
    return Response.json({ message: 'Inicia sesion para pagar.' }, { status: 401 });
  }

  const parsed = checkoutRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ message: 'El carrito no es valido.' }, { status: 400 });
  }

  const items = parsed.data.items.map((item) => {
    const product = getProduct(item.productId);
    if (!product) return null;
    return {
      productId: product.id,
      title: product.name,
      unitPrice: product.price,
      quantity: item.qty,
      totalAmount: product.price * item.qty,
    };
  });
  if (items.some((item) => item === null)) {
    return Response.json(
      { message: 'El carrito contiene un producto desconocido.' },
      { status: 400 },
    );
  }

  const safeItems = items.filter((item): item is NonNullable<typeof item> => item !== null);
  const amount = safeItems.reduce((total, item) => total + item.totalAmount, 0);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return Response.json({ message: 'El total del carrito no es valido.' }, { status: 400 });
  }

  const order = await createOrGetCheckoutOrder({
    customerUserId: user.id,
    customerEmail: user.email.trim().toLowerCase(),
    clientRequestId: parsed.data.clientRequestId,
    amount,
    note: parsed.data.note,
    items: safeItems,
  });

  try {
    const checkout = await createPaymentCheckout(paymentsConfig, {
      orderId: order.id,
      customerUserId: user.id,
    });
    return Response.json(checkout, { status: 201 });
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      return Response.json({ message: error.message, orderId: order.id }, { status: error.status });
    }
    return Response.json(
      { message: 'Ocurrio un error seguro al iniciar el pago.', orderId: order.id },
      { status: 500 },
    );
  }
}
