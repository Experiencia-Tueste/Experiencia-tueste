import type { Metadata } from 'next';
import SkipLink from '@/components/SkipLink';
import PortalBackdrop from '@/features/portal/components/PortalBackdrop';
import PortalFooter from '@/features/portal/components/PortalFooter';
import PortalHeader from '@/features/portal/components/PortalHeader';
import PortalHero from '@/features/portal/components/PortalHero';
import ExperienceCard from '@/features/portal/components/ExperienceCard';
import ShopCard from '@/features/portal/components/ShopCard';
import TuesteTreeCard from '@/features/portal/components/TuesteTreeCard';
import styles from '@/features/portal/portal.module.css';
import { loadShopifyStoreUrl } from '@/lib/config/env-server';

/**
 * Metadata específica del portal: la base global (metadataBase, OG y
 * Twitter image del layout) se conserva; aquí solo se reemplazan
 * title y description.
 */
export const metadata: Metadata = {
  title: 'Tueste · Elige tu camino',
  description:
    'Tienda Tueste Co, Experiencia Origen Tostado y Tueste Tree: tres caminos nacidos del mismo origen.',
};

/**
 * El portal se renderiza por petición: `SHOPIFY_STORE_URL` es configuración
 * de runtime del contenedor. Prerenderizado en el build, la tarjeta Tienda
 * quedaba fija en «Tienda próximamente» aunque la variable se definiera
 * después en el entorno de despliegue.
 */
export const dynamic = 'force-dynamic';

/**
 * URL de la tienda leída en runtime. Una variable mal escrita no debe tumbar
 * el portal: se registra solo el nombre del error (sin volcar el valor) y la
 * tarjeta cae a «Tienda próximamente».
 */
function resolveStoreUrl(): string | null {
  try {
    return loadShopifyStoreUrl();
  } catch (error) {
    console.error(
      '[portal] SHOPIFY_STORE_URL inválida; la tienda se muestra como próxima.',
      error instanceof Error ? error.name : 'unknown',
    );
    return null;
  }
}

/**
 * Portal de entrada Tueste: tres caminos, un origen.
 * La experiencia completa (audio, manifiesto, tienda, etc.) vive en
 * /experiencia; esta página es solo el portal editorial que la presenta
 * junto a la tienda Shopify (URL configurable, sin enlace roto si no
 * está definida).
 *
 * El SkipLink va antes del encabezado: primer foco del documento.
 */
export default function Home() {
  const storeUrl = resolveStoreUrl();

  return (
    <>
      <SkipLink />
      <PortalBackdrop />
      <PortalHeader />
      <div id="contenido-principal">
        <main id="contenido" tabIndex={-1}>
          <PortalHero />
          <div className={styles.cards}>
            <ShopCard storeUrl={storeUrl} />
            <ExperienceCard />
            <TuesteTreeCard />
          </div>
        </main>
        <PortalFooter />
      </div>
    </>
  );
}
