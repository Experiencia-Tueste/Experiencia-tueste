/**
 * Feature: auctions
 * ---------------------------------------------------------------------
 * Subastas de lotes de café y de piezas de arte.
 *
 * Regla del plan: las pujas se registran en el servidor con timestamp
 * de servidor (nunca del cliente) y una subasta cerrada no acepta más
 * pujas. El incremento mínimo se valida contra la puja más alta.
 */

export type AuctionKind = 'cafe' | 'arte';

export interface Auction {
  id: string;
  kind: AuctionKind;
  title: string;
  description: string;
  /** Precio inicial en COP. */
  startingPrice: number;
  /** Incremento mínimo entre pujas en COP. */
  minBidStep: number;
  /** Puja más alta actual (0 si nadie ha pujado). */
  currentBid: number;
  currentBidder?: string;
  endsAt: string;
  closed: boolean;
}

export interface Bid {
  auctionId: string;
  /** Monto en COP. */
  amount: number;
  bidder: string;
  /** Timestamp de servidor. */
  serverTime: string;
}

/** Subastas de ejemplo (datos del mockup). */
export const SEED_AUCTIONS: Auction[] = [
  {
    id: 'a1',
    kind: 'cafe',
    title: 'Lote 000 · Microlote de autor',
    description: '250 g del lote que abre la colección. Tueste medio, notas a panela y cítrico.',
    startingPrice: 90000,
    minBidStep: 5000,
    currentBid: 95000,
    currentBidder: 'Ana',
    endsAt: '2026-08-15T23:59:00Z',
    closed: false,
  },
  {
    id: 'a2',
    kind: 'arte',
    title: 'Print Espectrograma · Edición 1/1',
    description: 'El espectrograma de «Coherencia 432 Hz» impreso a mano, firmado y numerado.',
    startingPrice: 120000,
    minBidStep: 10000,
    currentBid: 0,
    endsAt: '2026-08-20T23:59:00Z',
    closed: false,
  },
  {
    id: 'a3',
    kind: 'cafe',
    title: 'Lote 000 · Caja de colección',
    description: 'Caja numerada con el café del lote fundacional y su vinilo de origen.',
    startingPrice: 150000,
    minBidStep: 15000,
    currentBid: 180000,
    currentBidder: 'Luis',
    endsAt: '2026-08-10T23:59:00Z',
    closed: true,
  },
];

export type BidResult =
  | { ok: true; auction: Auction }
  | { ok: false; reason: 'closed' | 'expired' | 'below-minimum' | 'below-current' };

/**
 * Registra una puja. La validación es pura; la persistencia y el
 * timestamp real los hace el servidor.
 *
 * `serverNow` es el timestamp del servidor (nunca del cliente): si la
 * subasta ya venció (endsAt <= serverNow), la puja se rechaza aunque el
 * flag `closed` aún no se haya persistido.
 */
export function placeBid(
  auctions: Auction[],
  auctionId: string,
  amount: number,
  bidder: string,
  serverNow: string,
): { auctions: Auction[]; result: BidResult } {
  const auction = auctions.find((a) => a.id === auctionId);
  if (!auction) return { auctions, result: { ok: false, reason: 'closed' } };
  if (auction.closed) return { auctions, result: { ok: false, reason: 'closed' } };

  const now = new Date(serverNow).getTime();
  const endsAt = new Date(auction.endsAt).getTime();
  if (!Number.isNaN(now) && !Number.isNaN(endsAt) && now >= endsAt) {
    return { auctions, result: { ok: false, reason: 'expired' } };
  }

  const base = auction.currentBid > 0 ? auction.currentBid : auction.startingPrice;
  if (amount < base + auction.minBidStep) {
    return { auctions, result: { ok: false, reason: 'below-minimum' } };
  }

  const updated: Auction = {
    ...auction,
    currentBid: amount,
    currentBidder: bidder,
  };
  return {
    auctions: auctions.map((a) => (a.id === auctionId ? updated : a)),
    result: { ok: true, auction: updated },
  };
}

/** Cierra una subasta (solo el servidor, cuando vence endsAt). */
export function closeAuction(auctions: Auction[], auctionId: string): Auction[] {
  return auctions.map((a) => (a.id === auctionId ? { ...a, closed: true } : a));
}
