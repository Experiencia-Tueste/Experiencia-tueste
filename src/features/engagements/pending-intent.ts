import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

export const PENDING_ENGAGEMENT_COOKIE = 'tueste_pending_engagement';
export const PENDING_ENGAGEMENT_TTL_SECONDS = 10 * 60;

export function createPendingEngagementToken() {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashPendingEngagementToken(token) };
}

export function hashPendingEngagementToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
