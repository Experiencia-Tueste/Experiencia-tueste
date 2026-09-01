import { generateKeyPairSync, verify } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { PaymentsServiceConfig } from '@/lib/config/payments-env';
import { signPaymentServiceJwt } from '../service-jwt';

describe('signPaymentServiceJwt', () => {
  it('firma un token RS256 corto sin credenciales de Mercado Pago', () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const config: PaymentsServiceConfig = {
      serviceUrl: 'http://localhost:8080',
      privateKeyPem: privateKey.export({ format: 'pem', type: 'pkcs8' }).toString(),
      keyId: 'test-key',
      issuer: 'tueste-web',
      audience: 'tueste-payments',
      timeoutMs: 2000,
    };

    const token = signPaymentServiceJwt(
      config,
      {
        subject: '45bd2c2e-e607-4b1f-9a79-43c5c3a2d6ac',
        orderId: '8ca2a164-bd6c-46e1-87a9-9cb3fc802fb6',
      },
      new Date('2026-08-31T12:00:00Z'),
    );
    const [header, payload, signature] = token.split('.');
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

    expect(decoded).toMatchObject({
      iss: 'tueste-web',
      aud: 'tueste-payments',
      scope: 'payments:create',
      exp: 1788177690,
    });
    expect(JSON.stringify(decoded)).not.toContain('access_token');
    expect(
      verify(
        'RSA-SHA256',
        Buffer.from(`${header}.${payload}`),
        publicKey,
        Buffer.from(signature, 'base64url'),
      ),
    ).toBe(true);
  });
});
