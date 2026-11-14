import type { AnalyticsEventName } from './event-contract';

export type AnalyticsEventRecord = {
  eventName: AnalyticsEventName;
  createdAt: Date;
};

export type OperationalErrorRecord = {
  route: string;
  status: number;
  createdAt: Date;
};

export function summarizeAnalytics(
  events: readonly AnalyticsEventRecord[],
  errors: readonly OperationalErrorRecord[],
) {
  const counts = new Map<AnalyticsEventName, number>();
  for (const event of events) counts.set(event.eventName, (counts.get(event.eventName) ?? 0) + 1);

  const funnel = [
    ['checkout_started', 'Checkout iniciados'],
    ['event_request_submitted', 'Solicitudes de eventos'],
    ['community_joined', 'Altas de comunidad'],
    ['radio_request_submitted', 'Solicitudes de Radio'],
    ['seller_application_submitted', 'Solicitudes de vendedor'],
    ['market_availability_requested', 'Consultas de disponibilidad'],
  ] as const;

  const errorGroups = new Map<string, number>();
  for (const error of errors) errorGroups.set(error.route, (errorGroups.get(error.route) ?? 0) + 1);

  return {
    total: events.length,
    byEvent: [...counts.entries()]
      .map(([eventName, value]) => ({ eventName, value }))
      .sort((a, b) => b.value - a.value),
    funnel: funnel.map(([eventName, label]) => ({
      label,
      value: counts.get(eventName) ?? 0,
    })),
    health: {
      operationalErrors: errors.length,
      errorGroups: [...errorGroups.entries()]
        .map(([route, value]) => ({ route, value }))
        .sort((a, b) => b.value - a.value),
    },
  };
}
