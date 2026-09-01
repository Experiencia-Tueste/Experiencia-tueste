import 'server-only';

import { desc } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { auditLogs } from '@/db/schema/admin-identity';
import { checkoutOrders } from '@/db/schema/payments';
import type { CurrentAdmin } from './authorization-core';

export async function getAnalyticsWorkspace(admin: CurrentAdmin) {
  if (!admin.capabilities.includes('analytics.read')) {
    throw new Error('403: se requiere analytics.read.');
  }

  const db = getDb();
  const [orders, activity] = await Promise.all([
    db.select().from(checkoutOrders).orderBy(desc(checkoutOrders.createdAt)).limit(1000),
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(1000),
  ]);

  const paidOrders = orders.filter((order) =>
    ['paid', 'partially_refunded', 'refunded'].includes(order.status),
  );
  const checkoutCreated = orders.filter((order) => order.checkoutUrl !== null);
  const revenue = paidOrders.reduce((sum, order) => sum + order.amount, 0);
  const customerCount = new Set(orders.map((order) => order.customerUserId)).size;
  const conversion = orders.length ? (paidOrders.length / orders.length) * 100 : 0;

  const days = Array.from({ length: 14 }, (_, offset) => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (13 - offset));
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: 'short',
        timeZone: 'UTC',
      }).format(date),
      orders: orders.filter((item) => item.createdAt.toISOString().slice(0, 10) === key).length,
      actions: activity.filter((item) => item.createdAt.toISOString().slice(0, 10) === key).length,
    };
  });

  const actionGroups = new Map<string, number>();
  for (const item of activity) {
    const group = item.action.split('.')[0] || 'other';
    actionGroups.set(group, (actionGroups.get(group) ?? 0) + 1);
  }

  return {
    metrics: {
      customerCount,
      orders: orders.length,
      checkoutCreated: checkoutCreated.length,
      paid: paidOrders.length,
      revenue,
      conversion,
      activity: activity.length,
    },
    funnel: [
      { label: 'Clientes con intención', value: customerCount },
      { label: 'Órdenes creadas', value: orders.length },
      { label: 'Checkout generado', value: checkoutCreated.length },
      { label: 'Pagos confirmados', value: paidOrders.length },
    ],
    days,
    actionGroups: [...actionGroups.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    recentOrders: orders.slice(0, 8).map((order) => ({
      id: order.id,
      email: order.customerEmail,
      amount: order.amount,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    })),
  };
}
