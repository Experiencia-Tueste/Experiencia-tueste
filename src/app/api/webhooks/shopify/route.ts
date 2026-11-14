import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { recordOperationalError } from '@/features/analytics/service';
import { verifyShopifyHmac } from '@/features/tueste-tree/shopify-webhook';
import { handleShopifyDelivery } from '@/features/tueste-tree/shopify-webhook-service';
import { loadShopifyWebhookSecret } from '@/lib/config/env-server';

export const dynamic = 'force-dynamic';

const ROUTE = '/api/webhooks/shopify';
/** Un aviso de pedido pesa unos pocos KB; se corta lo que no puede ser uno. */
const MAX_BODY_BYTES = 1024 * 1024;

function reportError(requestId: string, operation: string, status: number, errorCode: string) {
  void recordOperationalError({ requestId, route: ROUTE, operation, status, errorCode }).catch(
    () => undefined,
  );
}

/**
 * Avisos de la tienda Tueste Co (Shopify). No hay sesión: la identidad
 * del remitente es la firma HMAC del cuerpo crudo.
 *
 * - Sin secreto configurado: 503 (ruta cerrada).
 * - Firma ausente o inválida: 401, sin leer el contenido.
 * - Aviso atendido, repetido o irrelevante: 200 (Shopify deja de reintentar).
 * - Fallo al aplicar el efecto: 500, para que Shopify reintente.
 */
export async function POST(request: Request) {
  const requestId = randomUUID();
  const secret = loadShopifyWebhookSecret();
  if (!secret) {
    return NextResponse.json({ message: 'Avisos de la tienda no configurados.' }, { status: 503 });
  }

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    return NextResponse.json({ message: 'Aviso demasiado grande.' }, { status: 413 });
  }
  if (!verifyShopifyHmac(rawBody, request.headers.get('x-shopify-hmac-sha256'), secret)) {
    reportError(requestId, 'verify_signature', 401, 'shopify_signature_invalid');
    return NextResponse.json({ message: 'Firma inválida.' }, { status: 401 });
  }

  const deliveryId = request.headers.get('x-shopify-webhook-id')?.trim();
  const topic = request.headers.get('x-shopify-topic')?.trim();
  if (!deliveryId || !topic || deliveryId.length > 200 || topic.length > 100) {
    return NextResponse.json({ message: 'Faltan cabeceras del aviso.' }, { status: 400 });
  }

  try {
    const outcome = await handleShopifyDelivery({ deliveryId, topic, rawBody });
    if (outcome === 'unmatched') {
      // Pago o reembolso de una adopción que Experiencia no reconoce: no es
      // un error de la tienda, pero alguien debe revisarlo a mano.
      reportError(requestId, topic, 200, 'adoption_unmatched');
    }
    return NextResponse.json({ outcome });
  } catch {
    reportError(requestId, topic, 500, 'shopify_delivery_failed');
    return NextResponse.json(
      { message: 'No pudimos procesar el aviso.' },
      { status: 500, headers: { 'X-Request-Id': requestId } },
    );
  }
}
