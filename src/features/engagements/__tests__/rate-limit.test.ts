import { describe, expect, it } from 'vitest';
import { requestOrigin, ENGAGEMENT_RATE_LIMIT } from '../rate-limit';

describe('rate limiting de engagements', () => {
  it('usa el último salto de x-forwarded-for (el que agrega el proxy confiable)', () => {
    expect(
      requestOrigin(
        new Request('http://localhost/api/engagements', {
          headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.2', 'x-real-ip': '10.0.0.2' },
        }),
      ),
    ).toBe('10.0.0.2');
    expect(requestOrigin(new Request('http://localhost/api/engagements'))).toBe('unknown');
  });

  it('ignora un primer salto falsificado por el cliente', () => {
    expect(
      requestOrigin(
        new Request('http://localhost/api/engagements', {
          headers: { 'x-forwarded-for': 'atacante-spoofed-ip, 198.51.100.7' },
        }),
      ),
    ).toBe('198.51.100.7');
  });

  it('mantiene una ventana y límites explícitos', () => {
    expect(ENGAGEMENT_RATE_LIMIT).toEqual({
      windowMs: 600000,
      originMaxRequests: 20,
      userMaxRequests: 8,
    });
  });
});
