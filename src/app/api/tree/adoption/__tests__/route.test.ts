import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createServerSupabase: vi.fn(),
  getPendingAdoption: vi.fn(),
  startAdoption: vi.fn(),
  checkTreeAdoptionRateLimit: vi.fn(),
  recordOperationalError: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ createServerSupabase: mocks.createServerSupabase }));
vi.mock('@/features/tueste-tree/adoption-order-service', () => ({
  getPendingAdoption: mocks.getPendingAdoption,
  startAdoption: mocks.startAdoption,
}));
vi.mock('@/features/tueste-tree/rate-limit', () => ({
  checkTreeAdoptionRateLimit: mocks.checkTreeAdoptionRateLimit,
}));
vi.mock('@/features/analytics/service', () => ({
  recordOperationalError: mocks.recordOperationalError,
}));

import { GET, POST } from '../route';

const user = { id: '20ccda8d-1346-4af8-bade-5cc870bd31ce', email: 'ana@example.com' };
const adoption = {
  treeNumber: '001',
  treeName: 'Aurora',
  treesCount: 3,
  insignia: 'Semilla',
  payUrl:
    'https://tueste.co/cart/51668810006816:3?attributes%5Bref-experiencia%5D=TT-0000000000000000',
};
const validBody = { treeId: 'arbol-001', treeName: 'Aurora', treesCount: 3 };

function post(body?: unknown) {
  return new Request('http://localhost/api/tree/adoption', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? 'no es json' : JSON.stringify(body),
  });
}

function signedOut() {
  mocks.createServerSupabase.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
  });
}

describe('/api/tree/adoption', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createServerSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    });
    mocks.checkTreeAdoptionRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.getPendingAdoption.mockResolvedValue(adoption);
    mocks.startAdoption.mockResolvedValue({ status: 'ok', adoption });
    mocks.recordOperationalError.mockResolvedValue(undefined);
  });

  it('GET y POST exigen una sesión verificada', async () => {
    signedOut();

    expect((await GET()).status).toBe(401);
    expect((await POST(post(validBody))).status).toBe(401);
    expect(mocks.startAdoption).not.toHaveBeenCalled();
    expect(mocks.checkTreeAdoptionRateLimit).not.toHaveBeenCalled();
  });

  it('GET responde 401 si Supabase no está configurado', async () => {
    mocks.createServerSupabase.mockResolvedValue(null);

    expect((await GET()).status).toBe(401);
  });

  it('GET devuelve la adopción pendiente del usuario con sesión', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ adoption });
    expect(mocks.getPendingAdoption).toHaveBeenCalledWith(user);
  });

  it('GET responde 503 sin detalle si la consulta falla', async () => {
    mocks.getPendingAdoption.mockRejectedValue(new Error('detalle interno de postgres'));

    const response = await GET();

    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain('postgres');
  });

  it('POST guarda la adopción del usuario con sesión y devuelve el enlace de pago', async () => {
    const response = await POST(post(validBody));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ adoption });
    expect(mocks.startAdoption).toHaveBeenCalledWith(user, validBody);
  });

  it('POST ignora cualquier usuario o referencia que venga en el cuerpo', async () => {
    await POST(
      post({
        ...validBody,
        customerUserId: 'otro',
        reference: 'TT-AAAAAAAAAAAAAAAA',
        status: 'active',
      }),
    );

    expect(mocks.startAdoption).toHaveBeenCalledWith(user, validBody);
  });

  it('POST rechaza datos inválidos o un cuerpo que no es JSON', async () => {
    expect((await POST(post({ ...validBody, treesCount: 0 }))).status).toBe(400);
    expect((await POST(post({ ...validBody, treeId: 'arbol-999' }))).status).toBe(400);
    expect((await POST(post())).status).toBe(400);
    expect(mocks.startAdoption).not.toHaveBeenCalled();
  });

  it('POST responde 429 con Retry-After al superar el límite', async () => {
    mocks.checkTreeAdoptionRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 42 });

    const response = await POST(post(validBody));

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('42');
    expect(mocks.startAdoption).not.toHaveBeenCalled();
  });

  it('POST falla cerrado (503) si el límite de intentos no se puede comprobar', async () => {
    mocks.checkTreeAdoptionRateLimit.mockRejectedValue(new Error('sin base'));

    expect((await POST(post(validBody))).status).toBe(503);
    expect(mocks.startAdoption).not.toHaveBeenCalled();
  });

  it('POST responde 503 si la tienda no está disponible', async () => {
    mocks.startAdoption.mockResolvedValue({ status: 'store_unavailable' });

    expect((await POST(post(validBody))).status).toBe(503);
  });

  it('POST responde 503 sin detalle si guardar falla', async () => {
    mocks.startAdoption.mockRejectedValue(new Error('detalle interno de postgres'));

    const response = await POST(post(validBody));

    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain('postgres');
  });
});
