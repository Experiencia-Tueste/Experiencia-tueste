import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findPendingAdoptionOrder: vi.fn(),
  savePendingAdoptionOrder: vi.fn(),
  loadShopifyStoreUrl: vi.fn(),
}));

vi.mock('@/db/tree-adoption-order-repository', () => ({
  findPendingAdoptionOrder: mocks.findPendingAdoptionOrder,
  savePendingAdoptionOrder: mocks.savePendingAdoptionOrder,
}));
vi.mock('@/lib/config/env-server', () => ({ loadShopifyStoreUrl: mocks.loadShopifyStoreUrl }));

import { getPendingAdoption, startAdoption } from '../adoption-order-service';
import { ADOPCION_TIENDA, isAdoptionReference } from '../purchase';

const customer = { id: '20ccda8d-1346-4af8-bade-5cc870bd31ce', email: 'Ana@Example.com' };
const request = { treeId: 'arbol-001', treeName: 'Aurora', treesCount: 12 };
const order = {
  id: 'bc2d2b16-f3b6-4f1e-a53d-784e4f5edb75',
  customerUserId: customer.id,
  customerEmail: 'ana@example.com',
  treeKey: 'arbol-001',
  treeName: 'Aurora',
  treesCount: 12,
  reference: 'TT-0123456789ABCDEF',
  status: 'pending',
};

describe('adopción pendiente de Tueste Tree', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.loadShopifyStoreUrl.mockReturnValue('https://tueste.co');
    mocks.savePendingAdoptionOrder.mockResolvedValue(order);
    mocks.findPendingAdoptionOrder.mockResolvedValue(order);
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('guarda la elección con una referencia nueva y devuelve el enlace de pago', async () => {
    const result = await startAdoption(customer, request);

    const saved = mocks.savePendingAdoptionOrder.mock.calls[0][0];
    expect(saved).toMatchObject({
      customerUserId: customer.id,
      customerEmail: 'ana@example.com',
      treeKey: 'arbol-001',
      treeName: 'Aurora',
      treesCount: 12,
    });
    expect(isAdoptionReference(saved.reference)).toBe(true);
    expect(result).toEqual({
      status: 'ok',
      adoption: {
        treeNumber: '001',
        treeName: 'Aurora',
        treesCount: 12,
        insignia: 'Plata',
        payUrl: `https://tueste.co/cart/${ADOPCION_TIENDA.variantId}:12?attributes%5Bref-experiencia%5D=TT-0123456789ABCDEF`,
      },
    });
  });

  it('el enlace usa la referencia que quedó guardada, no la recién generada', async () => {
    // Reintento: el repositorio conserva la referencia de la adopción pendiente.
    const result = await startAdoption(customer, request);

    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.adoption.payUrl).toContain('TT-0123456789ABCDEF');
    }
  });

  it('no guarda nada si la tienda no está configurada', async () => {
    mocks.loadShopifyStoreUrl.mockReturnValue(null);

    await expect(startAdoption(customer, request)).resolves.toEqual({
      status: 'store_unavailable',
    });
    expect(mocks.savePendingAdoptionOrder).not.toHaveBeenCalled();
  });

  it('trata una URL de tienda inválida como tienda no disponible, sin volcar el valor', async () => {
    mocks.loadShopifyStoreUrl.mockImplementation(() => {
      throw new Error('valor-sensible-de-entorno');
    });

    await expect(startAdoption(customer, request)).resolves.toEqual({
      status: 'store_unavailable',
    });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain('valor-sensible-de-entorno');
  });

  it('devuelve null cuando el cliente no tiene adopción pendiente', async () => {
    mocks.findPendingAdoptionOrder.mockResolvedValue(null);

    await expect(getPendingAdoption(customer)).resolves.toBeNull();
  });

  it('resume la adopción pendiente; sin tienda, sin enlace de pago', async () => {
    mocks.loadShopifyStoreUrl.mockReturnValue(null);

    await expect(getPendingAdoption(customer)).resolves.toEqual({
      treeNumber: '001',
      treeName: 'Aurora',
      treesCount: 12,
      insignia: 'Plata',
      payUrl: null,
    });
  });
});
