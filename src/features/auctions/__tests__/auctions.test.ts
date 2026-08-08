import { describe, expect, it } from 'vitest';
import { closeAuction, placeBid, SEED_AUCTIONS } from '../index';

describe('feature auctions', () => {
  it('acepta una puja válida por encima del mínimo', () => {
    const { auctions, result } = placeBid(
      SEED_AUCTIONS,
      'a2',
      130000,
      'María',
      '2026-08-07T12:00:00Z',
    );
    expect(result.ok).toBe(true);
    const a = auctions.find((x) => x.id === 'a2')!;
    expect(a.currentBid).toBe(130000);
    expect(a.currentBidder).toBe('María');
  });

  it('rechaza pujas por debajo del incremento mínimo', () => {
    const { result } = placeBid(SEED_AUCTIONS, 'a1', 96000, 'María', '2026-08-07T12:00:00Z');
    expect(result).toEqual({ ok: false, reason: 'below-minimum' });
  });

  it('rechaza pujas en subastas cerradas', () => {
    const { result } = placeBid(SEED_AUCTIONS, 'a3', 200000, 'María', '2026-08-07T12:00:00Z');
    expect(result).toEqual({ ok: false, reason: 'closed' });
  });

  it('rechaza pujas cuando endsAt ya venció (serverNow)', () => {
    const { result } = placeBid(SEED_AUCTIONS, 'a1', 200000, 'María', '2026-08-16T00:00:00Z');
    expect(result).toEqual({ ok: false, reason: 'expired' });
  });

  it('acepta una puja exactamente antes del vencimiento', () => {
    const { result } = placeBid(SEED_AUCTIONS, 'a1', 200000, 'María', '2026-08-15T23:58:00Z');
    expect(result.ok).toBe(true);
  });

  it('cierra una subasta sin mutar las demás', () => {
    const auctions = closeAuction(SEED_AUCTIONS, 'a1');
    expect(auctions.find((a) => a.id === 'a1')!.closed).toBe(true);
    expect(auctions.find((a) => a.id === 'a2')!.closed).toBe(false);
  });
});
