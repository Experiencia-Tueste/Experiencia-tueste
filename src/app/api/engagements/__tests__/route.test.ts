import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../route';

const mocks = vi.hoisted(() => ({
  createServerSupabase: vi.fn(),
  checkEngagementRateLimit: vi.fn(),
  requestOrigin: vi.fn(),
  createEngagementRequest: vi.fn(),
  createPendingEngagementIntent: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: mocks.createServerSupabase,
}));
vi.mock('@/features/engagements/rate-limit', () => ({
  checkEngagementRateLimit: mocks.checkEngagementRateLimit,
  requestOrigin: mocks.requestOrigin,
}));
vi.mock('@/features/engagements/service', () => ({
  createEngagementRequest: mocks.createEngagementRequest,
  createPendingEngagementIntent: mocks.createPendingEngagementIntent,
  EngagementDomainError: class EngagementDomainError extends Error {
    status = 409 as const;
  },
}));

const COMMUNITY_INPUT = {
  type: 'community',
  reference: 'membership',
  payload: { preferences: ['events'], consent: true },
};

const VALID_INPUTS = [
  COMMUNITY_INPUT,
  {
    type: 'event',
    reference: 'a3f8b6c2-9d4e-4f1a-8b7c-2d5e6f7a8b9c',
    payload: { attendeeCount: 1, consent: true },
  },
  {
    type: 'radio',
    reference: 'senal',
    payload: {
      company: 'Café Norte',
      responsible: 'Ana',
      city: 'Bogotá',
      businessType: 'Café',
      locations: 1,
      hours: '8:00–18:00',
      consent: true,
    },
  },
  {
    type: 'market',
    reference: 'seller-onboarding',
    payload: {
      intent: 'seller_application',
      brand: 'Finca Roble',
      responsible: 'Luis',
      region: 'Quindío',
      category: 'Café tostado',
      consent: true,
    },
  },
] as const;

function request(body: unknown, headers?: HeadersInit) {
  return new Request('http://localhost/api/engagements', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/engagements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createServerSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error() }) },
    });
    mocks.requestOrigin.mockReturnValue('203.0.113.10');
    mocks.checkEngagementRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.createPendingEngagementIntent.mockResolvedValue('opaque-pending-token');
  });

  it('rechaza un payload inválido antes de crear intención o solicitud', async () => {
    const response = await POST(request({ type: 'event', reference: 'falso', payload: {} }));

    expect(response.status).toBe(400);
    expect(mocks.createPendingEngagementIntent).not.toHaveBeenCalled();
    expect(mocks.createEngagementRequest).not.toHaveBeenCalled();
  });

  it('responde 429 con Retry-After y mensaje usable', async () => {
    mocks.checkEngagementRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 42 });

    const response = await POST(request(COMMUNITY_INPUT));

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('42');
    expect((await response.json()).message).toMatch(/42 segundos/);
  });

  it('guarda la intención validada en cookie HttpOnly cuando falta login', async () => {
    const response = await POST(request(COMMUNITY_INPUT));

    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toMatch(
      /tueste_pending_engagement=opaque-pending-token/,
    );
    expect(response.headers.get('set-cookie')).toMatch(/HttpOnly/i);
    expect(mocks.createPendingEngagementIntent).toHaveBeenCalledWith(COMMUNITY_INPUT);
  });

  it('envía la solicitud autenticada al servicio y no crea intención pendiente', async () => {
    const user = { id: '20ccda8d-1346-4af8-bade-5cc870bd31ce', email: 'ana@tueste.co' };
    mocks.createServerSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    });
    mocks.createEngagementRequest.mockResolvedValue({
      request: { type: 'community' },
      created: true,
    });

    const response = await POST(request(COMMUNITY_INPUT));

    expect(response.status).toBe(200);
    expect(mocks.createEngagementRequest).toHaveBeenCalledWith(user, COMMUNITY_INPUT);
    expect(mocks.createPendingEngagementIntent).not.toHaveBeenCalled();
  });

  it.each(VALID_INPUTS)('valida y enruta solicitudes del dominio %s', async (input) => {
    const user = { id: '20ccda8d-1346-4af8-bade-5cc870bd31ce', email: 'ana@tueste.co' };
    mocks.createServerSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    });
    mocks.createEngagementRequest.mockResolvedValue({
      request: { type: input.type },
      created: true,
    });

    const response = await POST(request(input));

    expect(response.status).toBe(200);
    expect(mocks.createEngagementRequest).toHaveBeenCalledWith(user, input);
  });
});
