'use client';

import { useRef, useState } from 'react';
import {
  addToCart,
  cartCount,
  changeQty,
  formatoCOP,
  getProduct,
  PRODUCTS,
} from '@/features/commerce';
import type { CartItem } from '@/features/commerce';
import CartDrawer from './CartDrawer';
import ProductVisual from './ProductVisual';
import styles from './Tienda.module.css';

const MENSAJE_PAGOS = 'La página no procesa pagos.';

/**
 * Sección «07 / TIENDA» · Objetos del universo (#merch).
 * Catálogo de seis productos (PRODUCTS de features/commerce) con visual
 * SVG determinista, precio COP formateado con Intl (es-CO) y botón
 * «Agregar» que actualiza el contador y anuncia en aria-live. La
 * selección vive solo en memoria del componente cliente (sin
 * localStorage, cookies, APIs ni pagos); el drawer es accesible y el
 * cierre de compra solo anuncia que el canal aún no está habilitado.
 */
export default function Tienda() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anuncio, setAnuncio] = useState<string | null>(null);
  const abridorRef = useRef<HTMLButtonElement>(null);

  const count = cartCount(items);

  const agregar = (productId: string) => {
    setItems((prev) => addToCart(prev, productId));
    const p = getProduct(productId);
    setAnuncio(`${p?.name ?? productId} agregado a tu selección.`);
  };

  const cambiarQty = (productId: string, delta: number) => {
    setItems((prev) => changeQty(prev, productId, delta));
  };

  const abrirDrawer = () => setDrawerOpen(true);

  const cerrarDrawer = () => {
    setDrawerOpen(false);
    abridorRef.current?.focus();
  };

  return (
    <section id="merch" className={styles.section} aria-labelledby="tienda-titulo">
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
          ref={abridorRef}
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

      <div className={styles.grid}>
        {PRODUCTS.map((p) => (
          <article className={styles.card} key={p.id}>
            <div className={styles.ph}>
              <ProductVisual icon={p.icon} />
              {p.badge ? <span className={styles.badge}>{p.badge}</span> : null}
            </div>
            <div className={styles.body}>
              <span className={styles.cat}>{p.categoryLabel}</span>
              <h3 className={styles.name}>{p.name}</h3>
              <p className={styles.desc}>{p.description}</p>
              <div className={styles.foot}>
                <span className={styles.price}>{formatoCOP(p.price)}</span>
                <button type="button" className={styles.add} onClick={() => agregar(p.id)}>
                  Agregar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className={styles.note}>{MENSAJE_PAGOS}</p>

      <p className={styles.live} role="status" aria-live="polite">
        {anuncio ?? '\u00A0'}
      </p>

      <CartDrawer open={drawerOpen} items={items} onClose={cerrarDrawer} onQty={cambiarQty} />
    </section>
  );
}
