'use client';

import { useEffect, useRef, useState } from 'react';
import { cartTotal, formatoCOP, getProduct } from '@/features/commerce';
import type { CartItem } from '@/features/commerce';
import styles from './CartDrawer.module.css';

export interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onQty: (productId: string, delta: number) => void;
}

/**
 * Drawer de la selección (carrito en memoria del cliente). Dialog modal
 * con cierre por botón, Escape y clic en el overlay; focus trap simple y
 * devolución de foco al botón que lo abrió (lo gestiona Tienda). El
 * cierre de compra solo anuncia que el canal operativo aún no está
 * habilitado: sin pedidos, comprobantes ni códigos.
 */
export default function CartDrawer({ open, items, onClose, onQty }: CartDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const checkoutRequestRef = useRef<{ fingerprint: string; id: string } | null>(null);
  const total = cartTotal(items);

  // Foco inicial, Escape y focus trap mientras está abierto.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
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
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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
    setMensaje('Preparando tu pago seguro…');

    const fingerprint = JSON.stringify(items);
    if (checkoutRequestRef.current?.fingerprint !== fingerprint) {
      checkoutRequestRef.current = { fingerprint, id: crypto.randomUUID() };
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientRequestId: checkoutRequestRef.current.id,
          items,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        checkoutUrl?: unknown;
        message?: unknown;
      } | null;

      if (response.status === 401) {
        setMensaje('Inicia sesión con tu cuenta Tueste para continuar con el pago.');
        window.location.replace('/cuenta/iniciar-sesion?next=/experiencia%23merch');
        return;
      }
      if (!response.ok || typeof body?.checkoutUrl !== 'string') {
        setMensaje(
          typeof body?.message === 'string'
            ? body.message
            : 'No fue posible iniciar el pago. Inténtalo de nuevo.',
        );
        return;
      }

      setMensaje('Listo. Te llevamos a Mercado Pago…');
      window.location.assign(body.checkoutUrl);
    } catch {
      setMensaje('No pudimos conectar con el servicio de pagos. Inténtalo de nuevo.');
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
              <button
                type="button"
                className={styles.checkout}
                onClick={iniciarPago}
                disabled={procesando}
              >
                {procesando ? 'Preparando pago…' : 'Pagar con Mercado Pago'}
              </button>
              <p className={styles.note}>
                Pago seguro en Mercado Pago. Tueste no recibe datos de tarjeta.
              </p>
            </>
          ) : null}
          <p className={styles.live} role="status" aria-live="polite">
            {mensaje ?? '\u00A0'}
          </p>
        </div>
      </aside>
    </>
  );
}
