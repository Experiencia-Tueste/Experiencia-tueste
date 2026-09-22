import { describe, expect, it } from 'vitest';
import { requestOrigin, ENGAGEMENT_RATE_LIMIT } from '../rate-limit';

describe('rate limiting de engagements', () => {
  it('usa x-real-ip, el único header de IP de cliente que garantiza Railway', () => {
    expect(
      requestOrigin(
        new Headers({ 'x-forwarded-for': '203.0.113.10, 10.0.0.2', 'x-real-ip': '10.0.0.2' }),
      ),
    ).toBe('10.0.0.2');
    expect(requestOrigin(new Headers())).toBe('unknown');
  });

  it('ignora x-forwarded-for por completo, incluso si el cliente lo falsifica', () => {
    expect(
      requestOrigin(
        new Headers({
          'x-forwarded-for': 'atacante-spoofed-ip, 198.51.100.7',
          'x-real-ip': '198.51.100.7',
        }),
      ),
    ).toBe('198.51.100.7');
    expect(requestOrigin(new Headers({ 'x-forwarded-for': 'atacante-spoofed-ip' }))).toBe(
      'unknown',
    );
  });

  it('mantiene una ventana y límites explícitos', () => {
    expect(ENGAGEMENT_RATE_LIMIT).toEqual({
      windowMs: 600000,
      originMaxRequests: 20,
      userMaxRequests: 8,
    });
  });
});
