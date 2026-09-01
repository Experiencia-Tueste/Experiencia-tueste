import { requireCapability } from '@/lib/auth/authorization';
import { getAnalyticsWorkspace } from '@/features/admin/analytics-service';
import { AdminShell } from '../AdminShell';
import {
  currency,
  EmptyState,
  ModuleHeader,
  Panel,
  Stat,
  Stats,
  StatusBadge,
  dateTime,
} from '../_components/AdminUi';
import operationStyles from '../operations.module.css';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AnaliticaPage() {
  const admin = await requireCapability('analytics.read');
  const workspace = await getAnalyticsWorkspace(admin);
  const maxDaily = Math.max(1, ...workspace.days.flatMap((day) => [day.orders, day.actions]));
  const funnelMax = Math.max(1, ...workspace.funnel.map((step) => step.value));
  return (
    <AdminShell admin={admin} currentPath="/admin/analitica">
      <main className="admin-module-main">
        <ModuleHeader
          eyebrow="TUESTE · MEDICIÓN"
          title="Embudo y analítica"
          description="Conversión comercial y actividad operativa calculadas con datos persistidos, sin números simulados."
        />
        <Stats>
          <Stat
            value={workspace.metrics.customerCount}
            label="Clientes"
            hint="Con intención de compra"
          />
          <Stat value={workspace.metrics.orders} label="Órdenes" hint="Histórico consultado" />
          <Stat
            value={`${workspace.metrics.conversion.toFixed(1)}%`}
            label="Conversión"
            hint="Órdenes pagadas"
          />
          <Stat
            value={currency(workspace.metrics.revenue)}
            label="Ingresos"
            hint="Pagos confirmados"
          />
        </Stats>
        <Panel
          title="Actividad de los últimos 14 días"
          description="Ámbar: órdenes. Turquesa: acciones administrativas auditadas."
        >
          <div className={styles.chart} aria-label="Actividad diaria">
            {workspace.days.map((day) => (
              <div
                className={styles.day}
                key={day.key}
                title={`${day.label}: ${day.orders} órdenes, ${day.actions} acciones`}
              >
                <div className={styles.bars}>
                  <span
                    className={styles.orders}
                    style={{ height: `${Math.max(3, (day.orders / maxDaily) * 190)}px` }}
                  />
                  <span
                    className={styles.actions}
                    style={{ height: `${Math.max(3, (day.actions / maxDaily) * 190)}px` }}
                  />
                </div>
                <small>{day.label}</small>
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="Embudo de pagos"
          description="Cada nivel proviene del ledger de órdenes y Mercado Pago."
        >
          {workspace.metrics.orders === 0 ? (
            <EmptyState title="Aún no hay señales comerciales">
              El embudo comenzará a poblarse con las primeras órdenes reales.
            </EmptyState>
          ) : (
            <div className={styles.funnel}>
              {workspace.funnel.map((step) => (
                <div className={styles.funnelRow} key={step.label}>
                  <span>{step.label}</span>
                  <div className={styles.track}>
                    <div
                      className={styles.fill}
                      style={{ width: `${(step.value / funnelMax) * 100}%` }}
                    />
                  </div>
                  <strong>{step.value}</strong>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel
          title="Actividad por dominio"
          description="Distribución de las últimas acciones auditadas."
        >
          <div className={styles.groups}>
            {workspace.actionGroups.map((group) => (
              <div className={styles.group} key={group.label}>
                <strong>{group.value}</strong>
                <span>{group.label}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Órdenes recientes" description="Últimas señales del flujo de compra.">
          {workspace.recentOrders.length === 0 ? (
            <EmptyState title="Sin órdenes">
              Todavía no se han creado órdenes de checkout.
            </EmptyState>
          ) : (
            <div className={operationStyles.stack}>
              {workspace.recentOrders.map((order) => (
                <div className={operationStyles.cardHeader} key={order.id}>
                  <div>
                    <strong>{order.email}</strong>
                    <p className={operationStyles.meta}>
                      {dateTime(order.createdAt)} · {currency(order.amount)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              ))}
            </div>
          )}
        </Panel>
      </main>
    </AdminShell>
  );
}
