import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, GET, PUT } from '../route';

const mocks = vi.hoisted(() => ({
  createServerSupabase: vi.fn(),
  getCommunityConsent: vi.fn(),
  saveCommunityConsent: vi.fn(),
  withdrawCommunityConsent: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ createServerSupabase: mocks.createServerSupabase }));
vi.mock('@/features/community/consent-service', () => ({
  getCommunityConsent: mocks.getCommunityConsent,
  saveCommunityConsent: mocks.saveCommunityConsent,
  withdrawCommunityConsent: mocks.withdrawCommunityConsent,
}));

const user = { id: '20ccda8d-1346-4af8-bade-5cc870bd31ce', email: 'ana@tueste.co' };

function request(body?: unknown) {
  return new Request('http://localhost/api/community/consent', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/community/consent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createServerSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    });
    mocks.getCommunityConsent.mockResolvedValue({
      memberId: 'bc2d2b16-f3b6-4f1e-a53d-784e4f5edb75',
      requesterUserId: user.id,
      consentStatus: 'active',
      preferences: ['events'],
    });
  });

  it('requiere una sesión verificada', async () => {
    mocks.createServerSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error() }) },
    });
    expect((await GET()).status).toBe(401);
    expect((await DELETE()).status).toBe(401);
  });

  it('consulta el estado de la cuenta autenticada', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(mocks.getCommunityConsent).toHaveBeenCalledWith(user.id);
    expect((await response.json()).state.consentStatus).toBe('active');
  });

  it('valida y guarda cambios de preferencias con consentimiento explícito', async () => {
    const state = { consentStatus: 'active', preferences: ['coffee'] };
    mocks.saveCommunityConsent.mockResolvedValue(state);
    const response = await PUT(request({ preferences: ['coffee'], consent: true }));
    expect(response.status).toBe(200);
    expect(mocks.saveCommunityConsent).toHaveBeenCalledWith(user, {
      preferences: ['coffee'],
      consent: true,
    });
  });

  it('rechaza actualizar sin consentimiento y permite retiro idempotente', async () => {
    expect((await PUT(request({ preferences: ['coffee'], consent: false }))).status).toBe(400);
    mocks.withdrawCommunityConsent.mockResolvedValue({ consentStatus: 'withdrawn' });
    const response = await DELETE();
    expect(response.status).toBe(200);
    expect(mocks.withdrawCommunityConsent).toHaveBeenCalledWith(user.id);
  });
});
