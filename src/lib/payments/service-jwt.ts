import 'server-only';

import { createSign, randomUUID } from 'node:crypto';
import type { PaymentsServiceConfig } from '@/lib/config/payments-env';

function encodeJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export interface PaymentServiceClaims {
  subject: string;
  orderId: string;
}

/** Firma un JWT RS256 de un solo uso y 90 segundos para Spring Boot. */
export function signPaymentServiceJwt(
  config: PaymentsServiceConfig,
  claims: PaymentServiceClaims,
  now = new Date(),
) {
  const issuedAt = Math.floor(now.getTime() / 1000);
  const header = encodeJson({ alg: 'RS256', typ: 'JWT', kid: config.keyId });
  const payload = encodeJson({
    iss: config.issuer,
    aud: config.audience,
    sub: claims.subject,
    iat: issuedAt,
    nbf: issuedAt - 5,
    exp: issuedAt + 90,
    jti: randomUUID(),
    scope: 'payments:create',
    order_id: claims.orderId,
  });
  const signingInput = `${header}.${payload}`;
  const signature = createSign('RSA-SHA256')
    .update(signingInput)
    .end()
    .sign(config.privateKeyPem)
    .toString('base64url');

  return `${signingInput}.${signature}`;
}
