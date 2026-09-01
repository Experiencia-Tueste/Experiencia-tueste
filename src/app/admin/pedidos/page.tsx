import { requireCapability } from '@/lib/auth/authorization';
import { listRecentCheckoutOrders } from '@/db/payment-repository';
import { paymentStatus } from '@/features/payments/status';
import { formatoCOP } from '@/features/commerce';
import { AdminShell } from '../AdminShell';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function PedidosPage() {
  const admin = await requireCapability('orders.read');
  const orders = await listRecentCheckoutOrders();
  const paid = orders.filter((order) => order.status === 'paid');
  const pending = orders.filter((order) =>
    ['draft', 'checkout_created', 'pending'].includes(order.status),
  );
  const collected = paid.reduce((total, order) => total + order.amount, 0);

  return (
    <AdminShell admin={admin} currentPath="/admin/pedidos">
      <main className="admin-module-main">
        <header className="admin-module-header">
          <p className="admin-module-eyebrow">TUESTE · OPERACIÓN</p>
          <h1>Pedidos y pagos</h1>
          <p>Seguimiento de órdenes creadas por la tienda y confirmadas por Mercado Pago.</p>
        </header>

        <section className={styles.stats} aria-label="Resumen de pagos">
          <article>
            <span>Órdenes recientes</span>
            <strong>{orders.length}</strong>
          </article>
          <article>
            <span>Pendientes</span>
            <strong>{pending.length}</strong>
          </article>
          <article>
            <span>Recaudado</span>
            <strong>{formatoCOP(collected)}</strong>
          </article>
        </section>

        <section className="admin-module-section">
          <div className={styles.sectionHeading}>
            <div>
              <p className="admin-module-eyebrow">ÚLTIMAS 100 ÓRDENES</p>
              <h2>Actividad de checkout</h2>
            </div>
            <p>El webhook firmado es la fuente de verdad del estado.</p>
          </div>

          {orders.length === 0 ? (
            <p className={styles.empty}>Todavía no hay órdenes registradas.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th>Total</th>
                    <th>Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const status = paymentStatus(order.status);
                    return (
                      <tr key={order.id}>
                        <td>
                          <code>{order.id.slice(0, 8).toUpperCase()}</code>
                          <small>{order.providerOrderId ?? 'Sin ID externo'}</small>
                        </td>
                        <td>{order.customerEmail}</td>
                        <td>
                          <span className={`${styles.status} ${styles[status.tone]}`}>
                            {status.label}
                          </span>
                        </td>
                        <td>{formatoCOP(order.amount)}</td>
                        <td>
                          {new Intl.DateTimeFormat('es-CO', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }).format(order.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </AdminShell>
  );
}
