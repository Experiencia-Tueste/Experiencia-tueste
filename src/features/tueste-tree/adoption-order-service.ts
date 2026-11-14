import 'server-only';

import { randomBytes } from 'node:crypto';
import {
  findPendingAdoptionOrder,
  savePendingAdoptionOrder,
  type TreeAdoptionOrder,
} from '@/db/tree-adoption-order-repository';
import { loadShopifyStoreUrl } from '@/lib/config/env-server';
import { getArbol } from './data/cultivo';
import { insigniaParaCantidad } from './data/insignias';
import { buildAdoptionCartUrl, createAdoptionReference, type AdoptionRequest } from './purchase';

export interface AdoptionCustomer {
  id: string;
  email: string;
}

/** Lo que el navegador necesita para mostrar y completar una adopción pendiente. */
export interface PendingAdoptionSummary {
  treeNumber: string;
  treeName: string;
  treesCount: number;
  insignia: string | null;
  /** Enlace de carrito de la tienda; `null` si la tienda no está configurada. */
  payUrl: string | null;
}

/** URL de la tienda, o `null` si falta o está mal escrita (nunca lanza). */
function storeUrlOrNull(): string | null {
  try {
    return loadShopifyStoreUrl();
  } catch (error) {
    console.error(
      '[tree-adoption] SHOPIFY_STORE_URL inválida; no se puede enviar a pagar.',
      error instanceof Error ? error.name : 'unknown',
    );
    return null;
  }
}

function summarize(order: TreeAdoptionOrder, storeUrl: string | null): PendingAdoptionSummary {
  return {
    treeNumber: getArbol(order.treeKey)?.numero ?? order.treeKey,
    treeName: order.treeName,
    treesCount: order.treesCount,
    insignia: insigniaParaCantidad(order.treesCount)?.nombre ?? null,
    payUrl: storeUrl ? buildAdoptionCartUrl(storeUrl, order.treesCount, order.reference) : null,
  };
}

/** Adopción pendiente de pago del cliente, lista para mostrar; `null` si no hay. */
export async function getPendingAdoption(
  customer: AdoptionCustomer,
): Promise<PendingAdoptionSummary | null> {
  const order = await findPendingAdoptionOrder(customer.id);
  return order ? summarize(order, storeUrlOrNull()) : null;
}

export type StartAdoptionResult =
  | { status: 'ok'; adoption: PendingAdoptionSummary & { payUrl: string } }
  | { status: 'store_unavailable' };

/**
 * Guarda la elección como adopción pendiente y devuelve el enlace de pago.
 * Si la tienda no está configurada no guarda nada: no se deja al cliente
 * con una adopción que no puede pagar.
 */
export async function startAdoption(
  customer: AdoptionCustomer,
  request: AdoptionRequest,
): Promise<StartAdoptionResult> {
  const storeUrl = storeUrlOrNull();
  if (!storeUrl) return { status: 'store_unavailable' };

  const order = await savePendingAdoptionOrder({
    customerUserId: customer.id,
    customerEmail: customer.email.trim().toLowerCase(),
    treeKey: request.treeId,
    treeName: request.treeName,
    treesCount: request.treesCount,
    reference: createAdoptionReference((size) => randomBytes(size)),
  });
  const summary = summarize(order, storeUrl);
  return { status: 'ok', adoption: { ...summary, payUrl: summary.payUrl as string } };
}
