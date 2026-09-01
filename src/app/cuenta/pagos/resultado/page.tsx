import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCheckoutOrderForCustomer } from '@/db/payment-repository';
import { paymentStatus } from '@/features/payments/status';
import { formatoCOP } from '@/features/commerce';
import { createServerSupabase } from '@/lib/supabase/server';
import styles from './payment-result.module.css';

export const metadata = { title: 'Estado del pago · Tueste' };
export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ order?: string; result?: string }>;
};

export default async function PaymentResultPage({ searchParams }: Props) {
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/cuenta/iniciar-sesion');

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/cuenta/iniciar-sesion');

  const { order: orderId } = await searchParams;
  if (
    !orderId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)
  )
    notFound();

  const order = await getCheckoutOrderForCustomer(orderId, data.user.id);
  if (!order) notFound();

  const status = paymentStatus(order.status);
  const canRetry = ['draft', 'failed', 'canceled', 'expired'].includes(order.status);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.kicker}>Tueste · Pago seguro</p>
        <span className={`${styles.badge} ${styles[status.tone]}`}>{status.label}</span>
        <h1 className={styles.title}>
          {order.status === 'paid' ? 'Tu pedido ya está confirmado.' : 'Estamos validando tu pago.'}
        </h1>
        <p className={styles.intro}>
          El estado mostrado viene de Mercado Pago y de nuestro registro interno. Nunca usamos el
          parámetro de regreso del navegador para aprobar una compra.
        </p>

        <dl className={styles.summary}>
          <div>
            <dt>Pedido</dt>
            <dd>{order.id.slice(0, 8).toUpperCase()}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{formatoCOP(order.amount)}</dd>
          </div>
          <div>
            <dt>Correo</dt>
            <dd>{order.customerEmail}</dd>
          </div>
        </dl>

        <div className={styles.actions}>
          {canRetry && (
            <Link className={styles.primary} href="/experiencia#tienda">
              Volver al carrito
            </Link>
          )}
          <Link className={canRetry ? styles.secondary : styles.primary} href="/experiencia">
            Volver a Experiencia Tueste
          </Link>
          <Link className={styles.textLink} href={`/cuenta/pagos/resultado?order=${order.id}`}>
            Actualizar estado
          </Link>
        </div>
      </section>
    </main>
  );
}
