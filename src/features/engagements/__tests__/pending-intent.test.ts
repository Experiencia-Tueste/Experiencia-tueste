import { describe, expect, it } from 'vitest';
import {
  createPendingEngagementToken,
  hashPendingEngagementToken,
  PENDING_ENGAGEMENT_COOKIE,
  PENDING_ENGAGEMENT_TTL_SECONDS,
} from '../pending-intent';

describe('intención pendiente de engagement', () => {
  it('genera un token opaco y solo persiste un hash distinto', () => {
    const first = createPendingEngagementToken();
    const second = createPendingEngagementToken();

    expect(first.token).not.toBe(first.tokenHash);
    expect(first.tokenHash).toBe(hashPendingEngagementToken(first.token));
    expect(first.token).not.toBe(second.token);
    expect(first.tokenHash).not.toBe(second.tokenHash);
  });

  it('usa cookie con TTL corto y nombre estable', () => {
    expect(PENDING_ENGAGEMENT_COOKIE).toBe('tueste_pending_engagement');
    expect(PENDING_ENGAGEMENT_TTL_SECONDS).toBe(600);
  });
});
