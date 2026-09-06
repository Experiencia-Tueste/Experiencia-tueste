import type { EngagementType } from '@/features/engagements';

export type EngagementResult =
  { kind: 'ok'; message: string } | { kind: 'login' } | { kind: 'error'; message: string };

export async function submitEngagement(input: {
  type: EngagementType;
  reference: string;
  details?: string;
}): Promise<EngagementResult> {
  try {
    const response = await fetch('/api/engagements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (response.status === 401) return { kind: 'login' };
    const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
    if (!response.ok || typeof body?.message !== 'string') {
      return { kind: 'error', message: 'No pudimos registrar tu solicitud. Inténtalo de nuevo.' };
    }
    return { kind: 'ok', message: body.message };
  } catch {
    return { kind: 'error', message: 'No pudimos conectar con Tueste. Inténtalo de nuevo.' };
  }
}

export function loginPath(nextAnchor: string) {
  return `/cuenta/iniciar-sesion?next=${encodeURIComponent(`/experiencia#${nextAnchor}`)}`;
}
