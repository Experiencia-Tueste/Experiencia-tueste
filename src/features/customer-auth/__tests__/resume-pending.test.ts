import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  resumePendingEngagement: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/features/engagements/service', () => ({
  resumePendingEngagement: mocks.resumePendingEngagement,
}));

import { resumePendingEngagementAfterAuth } from '../resume-pending';

describe('reanudación de intención posterior al login', () => {
  const cookieStore = {
    get: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookies.mockResolvedValue(cookieStore);
  });

  it('consume y elimina la cookie una sola vez', async () => {
    cookieStore.get.mockReturnValue({ value: 'opaque-token' });
    mocks.resumePendingEngagement.mockResolvedValue({ created: true });
    const user = { id: '20ccda8d-1346-4af8-bade-5cc870bd31ce', email: 'ana@tueste.co' };

    await expect(resumePendingEngagementAfterAuth(user)).resolves.toEqual({ created: true });

    expect(mocks.resumePendingEngagement).toHaveBeenCalledWith(user, 'opaque-token');
    expect(cookieStore.delete).toHaveBeenCalledWith('tueste_pending_engagement');
  });

  it('conserva la cookie si la transacción falla para permitir reintento dentro del TTL', async () => {
    cookieStore.get.mockReturnValue({ value: 'opaque-token' });
    mocks.resumePendingEngagement.mockRejectedValue(new Error('database unavailable'));

    await expect(
      resumePendingEngagementAfterAuth({
        id: '20ccda8d-1346-4af8-bade-5cc870bd31ce',
        email: 'ana@tueste.co',
      }),
    ).resolves.toBeNull();

    expect(cookieStore.delete).not.toHaveBeenCalled();
  });
});
