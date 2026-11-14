'use client';

import { useEffect, useRef, useState } from 'react';
import { cartTotal, formatoCOP, getProduct, MAX_CART_QTY } from '@/features/commerce';
import { createCheckoutGateway, type CheckoutGateway } from '@/features/commerce/checkout';
import { trackAnalytics } from '@/features/analytics/client';
import type { CartItem } from '@/features/commerce';
import styles from './CartDrawer.module.css';

export interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onQty: (productId: string, delta: number) => void;
  gateway?: CheckoutGateway;
  maxQty?: number;
}

/**
 * Drawer de la selección (carrito en memoria del cliente). Dialog modal
 * con cierre por botón, Escape y clic en el overlay; focus trap simple y
 * devolución de foco al botón que lo abrió (lo gestiona Tienda). El canal
 * de checkout llega como gateway explícito: puede estar desactivado,
 * redirigir a Shopify o usar el BFF legado autenticado. No se inventan
 * pedidos, comprobantes ni códigos en los canales aún no habilitados.
 */
export default function CartDrawer({
  open,
  items,
  onClose,
  onQty,
  gateway = createCheckoutGateway({ mode: 'disabled', externalShopifyUrl: null }),
  maxQty = MAX_CART_QTY,
}: CartDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const total = cartTotal(items);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Foco inicial, Escape y focus trap mientras está abierto.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !drawerRef.current) return;
      const focusables = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const manejarQty = (productId: string, delta: number) => {
    onQty(productId, delta);
    const p = getProduct(productId);
    const actual = items.find((i) => i.productId === productId);
    const nuevo = (actual?.qty ?? 0) + delta;
    setMensaje(
      nuevo > 0
        ? `${p?.name ?? productId}: ${nuevo} ${nuevo === 1 ? 'unidad' : 'unidades'} en tu selección.`
        : `${p?.name ?? productId} eliminado de tu selección.`,
    );
  };

  const iniciarPago = async () => {
    if (procesando || items.length === 0) return;
    setProcesando(true);
    setMensaje('Preparando tu checkout…');
    void trackAnalytics('checkout_started', { itemCount: items.length, mode: gateway.mode });

    try {
      const result = await gateway.start(items);
      if (result.kind === 'login') {
        setMensaje(result.message);
        window.location.replace('/cuenta/iniciar-sesion?next=/experiencia%23merch');
        return;
      }
      if (result.kind === 'disabled' || result.kind === 'error') {
        setMensaje(result.message);
        return;
      }
      setMensaje(
        `Listo. Te llevamos a ${result.provider === 'mercadopago_legacy' ? 'Mercado Pago' : 'Shopify'}…`,
      );
      window.location.assign(result.url);
    } catch {
      setMensaje('No pudimos iniciar el checkout. Inténtalo de nuevo.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <>
      <div
        className={`${styles.overlay}${open ? ` ${styles.on}` : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={drawerRef}
        className={`${styles.drawer}${open ? ` ${styles.on}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Tu selección"
        aria-hidden={!open}
        inert={!open}
      >
        <div className={styles.head}>
          <b>Tu selección</b>
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Cerrar selección"
          >
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <b>Tu selección está vacía</b>
              <span>Lo que elijas aparecerá aquí.</span>
            </div>
          ) : (
            items.map((i) => {
              const p = getProduct(i.productId);
              if (!p) return null;
              return (
                <div className={styles.item} key={i.productId}>
                  <div className={styles.itemInfo}>
                    <b>{p.name}</b>
                    <span>{p.categoryLabel}</span>
                  </div>
                  <div className={styles.qty}>
                    <button
                      type="button"
                      aria-label={`Quitar uno de ${p.name}`}
                      onClick={() => manejarQty(p.id, -1)}
                    >
                      −
                    </button>
                    <span>{i.qty}</span>
                    <button
                      type="button"
                      aria-label={`Agregar uno de ${p.name}`}
                      onClick={() => manejarQty(p.id, 1)}
                      disabled={i.qty >= maxQty}
                      aria-disabled={i.qty >= maxQty}
                    >
                      +
                    </button>
                  </div>
                  <span className={styles.subtotal}>{formatoCOP(p.price * i.qty)}</span>
                  <button
                    type="button"
                    className={styles.remove}
                    aria-label={`Quitar ${p.name} de la selección`}
                    onClick={() => manejarQty(p.id, -i.qty)}
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className={styles.foot}>
          {items.length > 0 ? (
            <>
              <div className={styles.total}>
                <span>Total</span>
                <b>{formatoCOP(total)}</b>
              </div>
              {gateway.mode === 'disabled' || gateway.mode === 'shopify' ? (
                <button type="button" className={styles.checkout} disabled>
                  {gateway.mode === 'shopify' ? 'Shopify próximamente' : 'Compra próximamente'}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.checkout}
                  onClick={iniciarPago}
                  disabled={procesando}
                >
                  {procesando
                    ? 'Preparando checkout…'
                    : gateway.mode === 'external_shopify'
                      ? 'Continuar en Shopify'
                      : 'Pagar con Mercado Pago'}
                </button>
              )}
              <p className={styles.note}>
                {gateway.mode === 'mercadopago_legacy'
                  ? 'Pago seguro en Mercado Pago. Tueste no recibe datos de tarjeta.'
                  : gateway.mode === 'external_shopify'
                    ? 'El pago y los datos de tarjeta se gestionan en Shopify.'
                    : 'Tu selección no genera ningún cobro.'}
              </p>
            </>
          ) : null}
          <button type="button" className={styles.continue} onClick={onClose}>
            Continuar comprando
          </button>
          <p className={styles.live} role="status" aria-live="polite">
            {mensaje ?? '\u00A0'}
          </p>
        </div>
      </aside>
    </>
  );
}
