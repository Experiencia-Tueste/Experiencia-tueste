import type { Metadata } from 'next';
import Atmosphere from '@/components/home/Atmosphere';
import EditorialTicker from '@/components/home/EditorialTicker';
import Footer from '@/components/home/Footer';
import Hero from '@/components/home/Hero';
import ListeningExperience from '@/components/home/ListeningExperience';
import Manifiesto from '@/components/home/Manifiesto';
import Navbar from '@/components/home/Navbar';
import PublishedEditorial from '@/components/home/PublishedEditorial';
import SkipLink from '@/components/SkipLink';
import CustomerWelcome from '@/features/customer-auth/components/CustomerWelcome';
import { getPublicEditorialProjection } from '@/features/public-content/service';
import {
  EMPTY_PUBLIC_EDITORIAL_PROJECTION,
  type PublicEditorialProjection,
} from '@/features/public-content/types';

/**
 * Metadata explícita de la experiencia (conserva la base global del
 * layout: metadataBase, OG y Twitter image).
 */
export const metadata: Metadata = {
  title: 'Tueste · Origen Tostado',
  description:
    'Tueste · Origen Tostado. Café, música y ritual nacidos en el Eje Cafetero colombiano.',
};

/** La proyección editorial y sus URLs firmadas se resuelven por request. */
export const dynamic = 'force-dynamic';

/**
 * Página pública de Tueste · primera capa visual.
 * Navegación, atmósfera global, hero y todas las secciones públicas ya
 * implementadas (Escucha, Origen, Música, Barista, En Vivo, Tienda,
 * Negocios, Mercado de Origen y Comunidad), replicando el mockup
 * de referencia, más el footer público que cierra la experiencia.
 *
 * El SkipLink va ANTES del Navbar: es el primer elemento alcanzable con
 * Tab. Navbar lo marca inert (junto con `contenido-principal`) mientras
 * el menú móvil está abierto, para que el foco permanezca en el diálogo.
 */
export function ExperienceView({
  editorial = EMPTY_PUBLIC_EDITORIAL_PROJECTION,
}: {
  editorial?: PublicEditorialProjection;
}) {
  return (
    <>
      <SkipLink />
      <Navbar />
      <CustomerWelcome />
      <div id="contenido-principal">
        <Atmosphere />
        <main id="contenido" tabIndex={-1}>
          <Hero />
          <Manifiesto />
          <PublishedEditorial projection={editorial} />
          <EditorialTicker variant="amber" />
          <ListeningExperience />
        </main>
        <Footer />
      </div>
    </>
  );
}

export default async function Home() {
  let editorial = EMPTY_PUBLIC_EDITORIAL_PROJECTION;
  try {
    editorial = await getPublicEditorialProjection();
  } catch (error) {
    // El contenido administrable no debe tumbar la experiencia pública.
    console.error(
      '[public-content] no se pudo cargar la proyección editorial.',
      error instanceof Error ? error.name : 'unknown',
    );
  }
  return <ExperienceView editorial={editorial} />;
}
