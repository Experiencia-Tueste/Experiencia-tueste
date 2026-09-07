import { describe, expect, it } from 'vitest';
import { requestOrigin, ENGAGEMENT_RATE_LIMIT } from '../rate-limit';

describe('rate limiting de engagements', () => {
  it('extrae el origen del proxy sin registrar el payload', () => {
    expect(
      requestOrigin(
        new Request('http://localhost/api/engagements', {
          headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.2', 'x-real-ip': '10.0.0.2' },
        }),
      ),
    ).toBe('203.0.113.10');
    expect(requestOrigin(new Request('http://localhost/api/engagements'))).toBe('unknown');
  });

  it('mantiene una ventana y límites explícitos', () => {
    expect(ENGAGEMENT_RATE_LIMIT).toEqual({
      windowMs: 600000,
      originMaxRequests: 20,
      userMaxRequests: 8,
    });
  });
});
