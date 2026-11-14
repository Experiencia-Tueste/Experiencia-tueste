'use client';

import type { AnalyticsEventInput, AnalyticsEventName } from './event-contract';

const sentDedupeKeys = new Set<string>();

function eventId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

/** Envío best-effort; no usa cookies, localStorage, IP ni proveedores externos. */
export async function trackAnalytics(
  eventName: AnalyticsEventName,
  properties: AnalyticsEventInput['properties'],
  dedupeKey?: string,
) {
  if (dedupeKey) {
    if (sentDedupeKeys.has(dedupeKey)) return false;
    sentDedupeKeys.add(dedupeKey);
  }
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: eventId(),
        eventName,
        eventVersion: 1,
        properties,
      }),
      keepalive: true,
    });
  } catch {
    // La medición no interrumpe ninguna acción del usuario.
  }
  return true;
}
