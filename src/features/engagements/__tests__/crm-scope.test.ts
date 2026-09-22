import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  engagementRepository: {
    list: vi.fn(),
  },
}));

vi.mock('@/db/admin-engagement-repository', () => ({
  getEngagementRepository: () => mocks.engagementRepository,
}));
vi.mock('@/db/client', () => ({ getDb: () => ({ transaction: vi.fn() }) }));
vi.mock('@/lib/auth/authorization', () => ({ getCurrentAdmin: vi.fn() }));
vi.mock('@/db/admin-identity-repository', () => ({ getAdminRepository: vi.fn() }));
vi.mock('@/db/admin-event-repository', () => ({ getAdminEventRepository: vi.fn() }));
vi.mock('@/db/admin-radio-repository', () => ({ getAdminRadioRepository: vi.fn() }));
vi.mock('@/db/public-market-repository', () => ({ getPublicMarketRepository: vi.fn() }));

import { getEngagementRequests } from '../service';

const VENDOR_ID = '44444444-4444-4444-8444-444444444444';
const OTHER_VENDOR_ID = '55555555-5555-4555-8555-555555555555';

const BASE_REQUEST = {
  id: '11111111-1111-4111-8111-111111111111',
  requesterUserId: '33333333-3333-4333-8333-333333333333',
  requesterEmail: 'ana@example.com',
  requesterName: 'Ana',
  details: null,
  payload: {},
  status: 'pending' as const,
  radioStage: null,
  radioCompanyId: null,
  radioChannelId: null,
  marketStage: null,
  marketVendorId: null,
  createdAt: '2026-09-07T12:00:00.000Z',
  updatedAt: '2026-09-07T12:00:00.000Z',
};

const ALL_REQUESTS = [
  { ...BASE_REQUEST, id: 'evt-1', type: 'event' as const, reference: 'evento-1' },
  { ...BASE_REQUEST, id: 'com-1', type: 'community' as const, reference: 'membership' },
  { ...BASE_REQUEST, id: 'radio-1', type: 'radio' as const, reference: 'plan-basico' },
  {
    ...BASE_REQUEST,
    id: 'market-own',
    type: 'market' as const,
    reference: 'seller-onboarding',
    marketStage: 'approved' as const,
    marketVendorId: VENDOR_ID,
  },
  {
    ...BASE_REQUEST,
    id: 'market-other',
    type: 'market' as const,
    reference: 'seller-onboarding',
    marketStage: 'approved' as const,
    marketVendorId: OTHER_VENDOR_ID,
  },
];

describe('alcance de crm.read sin crm.manage', () => {
  it('un operador/admin con crm.manage ve toda la bandeja', async () => {
    mocks.engagementRepository.list.mockResolvedValue(ALL_REQUESTS);

    const result = await getEngagementRequests({
      id: 'admin-1',
      email: 'admin@tueste.co',
      name: 'Admin',
      role: 'admin',
      capabilities: ['crm.read', 'crm.manage'],
    });

    expect(result).toEqual(ALL_REQUESTS);
  });

  it('un vendedor sin crm.manage solo ve sus propias solicitudes de mercado ya vinculadas', async () => {
    mocks.engagementRepository.list.mockResolvedValue(ALL_REQUESTS);

    const result = await getEngagementRequests({
      id: 'vendor-user-1',
      email: 'vendedor@tueste.co',
      name: 'Vendedor',
      role: 'vendedor',
      capabilities: ['crm.read', 'orders.read', 'market.read', 'market.self'],
      vendorId: VENDOR_ID,
    });

    expect(result).toEqual([ALL_REQUESTS[3]]);
    expect(result.some((r) => r.id === 'market-other')).toBe(false);
    expect(result.some((r) => r.type !== 'market')).toBe(false);
  });

  it('un vendedor sin vendorId resuelto no ve nada (fail closed)', async () => {
    mocks.engagementRepository.list.mockResolvedValue(ALL_REQUESTS);

    const result = await getEngagementRequests({
      id: 'vendor-user-2',
      email: 'sin-vendor@tueste.co',
      name: 'Sin vendedor',
      role: 'vendedor',
      capabilities: ['crm.read', 'orders.read', 'market.read', 'market.self'],
    });

    expect(result).toEqual([]);
  });

  it('un lector con crm.read pero sin crm.manage ni vendorId no ve nada', async () => {
    mocks.engagementRepository.list.mockResolvedValue(ALL_REQUESTS);

    const result = await getEngagementRequests({
      id: 'lector-1',
      email: 'lector@tueste.co',
      name: 'Lector',
      role: 'lector',
      capabilities: ['crm.read'],
    });

    expect(result).toEqual([]);
  });
});
