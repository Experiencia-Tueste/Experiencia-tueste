import { DEFAULT_CHECKOUT_CONFIG, type CheckoutConfig } from '@/features/commerce/checkout';
import { intentId } from '@/features/commerce/intent';
import Reveal from './Reveal';
import SectionGhost from './SectionGhost';
import styles from './Tienda.module.css';

const STORE_INTENT = intentId('merchandise', 'tienda');

/**
 * Sección «07 / TIENDA» (#merch).
 * Experiencia no vende ni cobra: la compra y el pago viven en la tienda
 * Tueste Co (Shopify). Esta sección solo lleva hasta allá.
 *
 * El enlace sale de la configuración de servidor (`CHECKOUT_MODE=external_shopify`
 * + `SHOPIFY_STORE_URL`). Sin esa configuración se muestra «Tienda próximamente»
 * en lugar de un enlace roto, igual que la tarjeta de la portada.
 */
export default function Tienda({
  checkoutConfig = DEFAULT_CHECKOUT_CONFIG,
}: {
  checkoutConfig?: CheckoutConfig;
}) {
  const storeUrl =
    checkoutConfig.mode === 'external_shopify' ? checkoutConfig.externalShopifyUrl : null;

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
              Café, objetos y rituales para llevar el origen contigo. La compra y el pago se hacen
              en la tienda Tueste Co.
            </p>
            <h2 id="tienda-titulo" className={styles.title}>
              Objetos del <em>universo</em>
            </h2>
          </div>
          {storeUrl ? (
            <a
              className={styles.cartbtn}
              href={storeUrl}
              target="_blank"
              rel="noreferrer noopener"
              data-commercial-intent={STORE_INTENT}
            >
              Entrar a la tienda
              <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <span
              className={styles.cartbtnDisabled}
              aria-disabled="true"
              data-commercial-intent={STORE_INTENT}
            >
              Tienda próximamente
            </span>
          )}
        </div>
      </Reveal>

      <Reveal>
        <p className={styles.note}>
          {storeUrl
            ? 'El pago continúa en la tienda segura de Shopify.'
            : 'La tienda abrirá pronto en Shopify.'}
        </p>
      </Reveal>
    </section>
  );
}
