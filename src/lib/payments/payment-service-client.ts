import 'server-only';

import type { PaymentsServiceConfig } from '@/lib/config/payments-env';
import { signPaymentServiceJwt } from './service-jwt';

export interface CheckoutSession {
  orderId: string;
  status: string;
  checkoutUrl: string;
}

export class PaymentServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'PaymentServiceError';
  }
}

export async function createPaymentCheckout(
  config: PaymentsServiceConfig,
  input: { orderId: string; customerUserId: string },
): Promise<CheckoutSession> {
  const token = signPaymentServiceJwt(config, {
    subject: input.customerUserId,
    orderId: input.orderId,
  });

  let response: Response;
  try {
    response = await fetch(`${config.serviceUrl}/internal/v1/checkout/orders/${input.orderId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: '{}',
      cache: 'no-store',
      signal: AbortSignal.timeout(config.timeoutMs),
    });
  } catch {
    throw new PaymentServiceError('El servicio de pagos no esta disponible.', 503);
  }

  const body = (await response.json().catch(() => null)) as {
    orderId?: unknown;
    status?: unknown;
    checkoutUrl?: unknown;
    message?: unknown;
  } | null;

  if (!response.ok) {
    const publicMessage =
      response.status === 401 || response.status === 403
        ? 'La autorizacion interna del pago fue rechazada.'
        : response.status >= 500
          ? 'Mercado Pago no esta disponible en este momento.'
          : typeof body?.message === 'string'
            ? body.message
            : 'No fue posible iniciar el pago.';
    throw new PaymentServiceError(publicMessage, response.status);
  }

  if (
    typeof body?.orderId !== 'string' ||
    typeof body.status !== 'string' ||
    typeof body.checkoutUrl !== 'string' ||
    !body.checkoutUrl.startsWith('https://')
  ) {
    throw new PaymentServiceError('El servicio de pagos devolvio una respuesta invalida.', 502);
  }

  return {
    orderId: body.orderId,
    status: body.status,
    checkoutUrl: body.checkoutUrl,
  };
}
