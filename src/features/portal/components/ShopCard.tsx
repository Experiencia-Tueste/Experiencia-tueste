import Image from 'next/image';
import { loadShopifyStoreUrl } from '@/lib/config/env-server';
import styles from './ShopCard.module.css';

export interface ShopCardProps {
  /**
   * URL de la tienda para presentación/pruebas. Si no se inyecta, se
   * usa `loadShopifyStoreUrl()` (lectura de SHOPIFY_STORE_URL,
   * exclusivamente en servidor).
   */
  storeUrl?: string | null;
}

/**
 * Tarjeta Tienda Tueste Co del portal. Server component: por defecto
 * lee SHOPIFY_STORE_URL mediante el contrato de configuración (nunca
 * process.env directo desde cliente).
 *
 * - Con URL válida: CTA como enlace externo seguro (target=_blank,
 *   rel=noreferrer) con flecha externa discreta.
 * - Sin URL: CTA deshabilitado «Tienda próximamente» con aclaración
 *   accesible breve (sin enlace roto).
 *
 * Ilustración: arte local `portal-tienda-artwork-v1.webp` (1448 × 1086)
 * como imagen decorativa (alt="" + aria-hidden), con sizes para tarjeta
 * apilada en móvil y dos columnas en escritorio.
 */
export default function ShopCard({ storeUrl }: ShopCardProps) {
  const resolvedUrl = storeUrl !== undefined ? storeUrl : loadShopifyStoreUrl();

  return (
    <article className={styles.card}>
      <span className={styles.medallion} aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        >
          <ellipse cx="12" cy="13.5" rx="5" ry="3.4" />
          <path d="M8.6 11.6 Q12 14.6 15.4 11.6" />
        </svg>
      </span>
      <div className={styles.visual} aria-hidden="true">
        <Image
          src="/images/portal/portal-tienda-artwork-v1.webp"
          alt=""
          width={1448}
          height={1086}
          className={styles.art}
          sizes="(max-width: 780px) 100vw, 574px"
          priority={false}
        />
      </div>
      <h2 className={styles.title}>Tienda Tueste Co</h2>
      <p className={styles.desc}>Café, objetos y rituales para llevar el origen contigo.</p>
      {resolvedUrl ? (
        <a className={styles.cta} href={resolvedUrl} target="_blank" rel="noreferrer noopener">
          Entrar a la tienda
          <span className={styles.arrow} aria-hidden="true">
            ↗
          </span>
        </a>
      ) : (
        <span className={styles.ctaDisabled} aria-disabled="true">
          Tienda próximamente
          <span className={styles.hint}>La tienda abrirá pronto en Shopify.</span>
        </span>
      )}
    </article>
  );
}
