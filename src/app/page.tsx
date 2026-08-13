import type { Metadata } from 'next';
import SkipLink from '@/components/SkipLink';
import PortalBackdrop from '@/features/portal/components/PortalBackdrop';
import PortalFooter from '@/features/portal/components/PortalFooter';
import PortalHeader from '@/features/portal/components/PortalHeader';
import PortalHero from '@/features/portal/components/PortalHero';
import ExperienceCard from '@/features/portal/components/ExperienceCard';
import ShopCard from '@/features/portal/components/ShopCard';
import styles from '@/features/portal/portal.module.css';

/**
 * Metadata específica del portal: la base global (metadataBase, OG y
 * Twitter image del layout) se conserva; aquí solo se reemplazan
 * title y description.
 */
export const metadata: Metadata = {
  title: 'Tueste · Elige tu camino',
  description:
    'Tienda Tueste Co y Experiencia Origen Tostado: dos caminos nacidos del mismo origen.',
};

/**
 * Portal de entrada Tueste: dos caminos, un origen.
 * La experiencia completa (audio, manifiesto, tienda, etc.) vive en
 * /experiencia; esta página es solo el portal editorial que la presenta
 * junto a la tienda Shopify (URL configurable, sin enlace roto si no
 * está definida).
 *
 * El SkipLink va antes del encabezado: primer foco del documento.
 */
export default function Home() {
  return (
    <>
      <SkipLink />
      <PortalBackdrop />
      <PortalHeader />
      <div id="contenido-principal">
        <main id="contenido" tabIndex={-1}>
          <PortalHero />
          <div className={styles.cards}>
            <ShopCard />
            <ExperienceCard />
          </div>
        </main>
        <PortalFooter />
      </div>
    </>
  );
}
