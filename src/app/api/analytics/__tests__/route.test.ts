import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../route';

const mocks = vi.hoisted(() => ({
  checkAnalyticsRateLimit: vi.fn(),
  requestOrigin: vi.fn(),
  recordAnalyticsEvent: vi.fn(),
}));

vi.mock('@/features/analytics/rate-limit', () => ({
  checkAnalyticsRateLimit: mocks.checkAnalyticsRateLimit,
}));
vi.mock('@/features/engagements/rate-limit', () => ({
  requestOrigin: mocks.requestOrigin,
}));
vi.mock('@/features/analytics/service', () => ({
  recordAnalyticsEvent: mocks.recordAnalyticsEvent,
}));

const VALID_EVENT = {
  eventVersion: 1,
  eventId: '11111111-1111-4111-8111-111111111111',
  eventName: 'cart_opened',
  properties: { itemCount: 2 },
};

function request(body: unknown) {
  return new Request('http://localhost/api/analytics', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requestOrigin.mockReturnValue('203.0.113.10');
    mocks.checkAnalyticsRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.recordAnalyticsEvent.mockResolvedValue({ accepted: true, duplicate: false });
  });

  it('rechaza con 429 y Retry-After cuando se excede el límite por origen', async () => {
    mocks.checkAnalyticsRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 37 });

    const response = await POST(request(VALID_EVENT));

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('37');
    expect(mocks.recordAnalyticsEvent).not.toHaveBeenCalled();
  });

  it('falla cerrado con 503 si el chequeo de límite no está disponible', async () => {
    mocks.checkAnalyticsRateLimit.mockRejectedValue(new Error('db down'));

    const response = await POST(request(VALID_EVENT));

    expect(response.status).toBe(503);
    expect(mocks.recordAnalyticsEvent).not.toHaveBeenCalled();
  });

  it('registra el evento cuando está dentro del límite', async () => {
    const response = await POST(request(VALID_EVENT));

    expect(response.status).toBe(202);
    expect(mocks.recordAnalyticsEvent).toHaveBeenCalledWith(VALID_EVENT);
  });
});
