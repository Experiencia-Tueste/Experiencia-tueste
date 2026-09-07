'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MAX_CART_QTY,
  addToCart,
  cartCount,
  changeQty,
  formatoCOP,
  getProduct,
  PRODUCTS,
  sanitizeCart,
} from '@/features/commerce';
import {
  createCheckoutGateway,
  DEFAULT_CHECKOUT_CONFIG,
  type CheckoutConfig,
} from '@/features/commerce/checkout';
import type { CartItem } from '@/features/commerce';
import CartDrawer from './CartDrawer';
import ProductVisual from './ProductVisual';
import Reveal from './Reveal';
import SectionGhost from './SectionGhost';
import styles from './Tienda.module.css';

const CART_STORAGE_KEY = 'tueste:cart:v1';

function paymentMessage(mode: CheckoutConfig['mode']) {
  if (mode === 'external_shopify') return 'El pago continúa en la tienda segura de Shopify.';
  if (mode === 'mercadopago_legacy') {
    return 'Pago seguro con Mercado Pago. Los precios y el total se validan nuevamente en el servidor.';
  }
  if (mode === 'shopify') return 'El checkout de Shopify estará disponible próximamente.';
  return 'El checkout está desactivado por ahora. Tu selección se conserva para más adelante.';
}

/**
 * Sección «07 / TIENDA» · Objetos del universo (#merch).
 * Catálogo de seis productos (PRODUCTS de features/commerce) con visual
 * SVG determinista, precio COP formateado con Intl (es-CO) y botón
 * «Agregar» que actualiza el contador y anuncia en aria-live. La
 * selección se conserva localmente para sobrevivir al inicio de sesión;
 * el checkout se delega al gateway configurado sin prometer un proveedor
 * que no esté habilitado.
 */
export default function Tienda({
  checkoutConfig = DEFAULT_CHECKOUT_CONFIG,
}: {
  checkoutConfig?: CheckoutConfig;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anuncio, setAnuncio] = useState<string | null>(null);
  const abridorRef = useRef<HTMLButtonElement>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const cartHydrated = useRef(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? '[]') as unknown;
      queueMicrotask(() => {
        cartHydrated.current = true;
        setItems(sanitizeCart(stored));
      });
    } catch {
      try {
        window.localStorage.removeItem(CART_STORAGE_KEY);
      } catch {
        // El almacenamiento puede estar bloqueado; el carrito sigue en memoria.
      }
      cartHydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!cartHydrated.current) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // El almacenamiento puede estar lleno o bloqueado sin interrumpir la compra.
    }
  }, [items]);

  const count = cartCount(items);

  const gateway = createCheckoutGateway(checkoutConfig);

  const agregar = (productId: string, opener: HTMLButtonElement) => {
    abridorRef.current = opener;
    setItems((prev) => addToCart(prev, productId));
    const p = getProduct(productId);
    setAnuncio(`${p?.name ?? productId} agregado a tu selección.`);
    setDrawerOpen(true);
  };

  const cambiarQty = (productId: string, delta: number) => {
    setItems((prev) => changeQty(prev, productId, delta));
  };

  const abrirDrawer = () => {
    abridorRef.current = cartButtonRef.current;
    setDrawerOpen(true);
  };

  const cerrarDrawer = () => {
    setDrawerOpen(false);
    abridorRef.current?.focus();
  };

  return (
    <section id="merch" className={styles.section} aria-labelledby="tienda-titulo">
      <SectionGhost number="07" />
      <Reveal>
        <div className={styles.head}>
          <div>
            <div className={styles.sechead}>
              <span className={styles.secnum}>07 / TIENDA</span>
            </div>
            <p className={styles.lead}>
              Objetos del universo Origen Tostado: piezas para llevar el ritual a casa. Eliges aquí,
              con calma — el pedido se confirma después, directo con el equipo.
            </p>
            <h2 id="tienda-titulo" className={styles.title}>
              Objetos del <em>universo</em>
            </h2>
          </div>
          <button
            ref={cartButtonRef}
            type="button"
            className={styles.cartbtn}
            onClick={abrirDrawer}
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
            aria-label={`Tu selección, ${count} ${count === 1 ? 'producto' : 'productos'}`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 8h14l-1.2 11a2 2 0 01-2 1.8H8.2a2 2 0 01-2-1.8z" />
              <path d="M8.5 8V6.5a3.5 3.5 0 017 0V8" />
            </svg>
            Tu selección
            <span className={styles.count} aria-hidden="true">
              {count}
            </span>
          </button>
        </div>
      </Reveal>

      <Reveal>
        <div className={styles.grid}>
          {PRODUCTS.map((p) => (
            <article className={styles.card} key={p.id}>
              <div className={styles.ph}>
                <ProductVisual icon={p.icon} imageSrc={p.imageSrc} name={p.name} />
                {p.badge ? <span className={styles.badge}>{p.badge}</span> : null}
              </div>
              <div className={styles.body}>
                <span className={styles.cat}>{p.categoryLabel}</span>
                <h3 className={styles.name}>{p.name}</h3>
                <p className={styles.desc}>{p.description}</p>
                <div className={styles.foot}>
                  <span className={styles.price}>{formatoCOP(p.price)}</span>
                  <button
                    type="button"
                    className={styles.add}
                    onClick={(event) => agregar(p.id, event.currentTarget)}
                    data-commercial-intent={`merch-${p.id}`}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <p className={styles.note}>{paymentMessage(checkoutConfig.mode)}</p>
      </Reveal>

      <p className={styles.live} role="status" aria-live="polite">
        {anuncio ?? '\u00A0'}
      </p>

      <CartDrawer
        open={drawerOpen}
        items={items}
        onClose={cerrarDrawer}
        onQty={cambiarQty}
        gateway={gateway}
        maxQty={MAX_CART_QTY}
      />
    </section>
  );
}
