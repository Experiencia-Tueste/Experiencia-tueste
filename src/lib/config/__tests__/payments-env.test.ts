import { describe, expect, it } from 'vitest';
import { loadPaymentsServiceConfig } from '../payments-env';

const TEST_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----';

describe('loadPaymentsServiceConfig', () => {
  it('desactiva pagos cuando no hay configuracion', () => {
    expect(loadPaymentsServiceConfig({})).toBeNull();
  });

  it('acepta red privada de Railway y normaliza PEM', () => {
    expect(
      loadPaymentsServiceConfig({
        PAYMENTS_SERVICE_URL: 'http://tueste-payments.railway.internal:8080/',
        PAYMENTS_JWT_PRIVATE_KEY: TEST_PRIVATE_KEY.replace(/\n/g, '\\n'),
      }),
    ).toMatchObject({
      serviceUrl: 'http://tueste-payments.railway.internal:8080',
      issuer: 'tueste-web',
      audience: 'tueste-payments',
    });
  });

  it('rechaza configuracion parcial', () => {
    expect(() =>
      loadPaymentsServiceConfig({ PAYMENTS_SERVICE_URL: 'https://payments.example.com' }),
    ).toThrow(/incompleta/);
  });
});
