import 'server-only';

import { cookies } from 'next/headers';
import { resumePendingEngagement } from '@/features/engagements/service';
import { PENDING_ENGAGEMENT_COOKIE } from '@/features/engagements/pending-intent';

/**
 * Reanuda como máximo una intención pendiente. Si la base falla, se conserva
 * la cookie para permitir reintentar durante su TTL sin bloquear el login.
 */
export async function resumePendingEngagementAfterAuth(user: { id: string; email: string }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(PENDING_ENGAGEMENT_COOKIE)?.value;
  if (!token) return null;

  try {
    const result = await resumePendingEngagement(user, token);
    cookieStore.delete(PENDING_ENGAGEMENT_COOKIE);
    return result;
  } catch {
    return null;
  }
}
