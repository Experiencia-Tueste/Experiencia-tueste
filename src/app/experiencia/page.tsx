import type { Metadata } from 'next';
import Atmosphere from '@/components/home/Atmosphere';
import EditorialTicker from '@/components/home/EditorialTicker';
import Footer from '@/components/home/Footer';
import Hero from '@/components/home/Hero';
import ListeningExperience from '@/components/home/ListeningExperience';
import Manifiesto from '@/components/home/Manifiesto';
import Navbar from '@/components/home/Navbar';
import SkipLink from '@/components/SkipLink';

/**
 * Metadata explícita de la experiencia (conserva la base global del
 * layout: metadataBase, OG y Twitter image).
 */
export const metadata: Metadata = {
  title: 'Tueste · Origen Tostado',
  description:
    'Tueste · Origen Tostado. Café, música y ritual nacidos en el Eje Cafetero colombiano.',
};

/**
 * Página pública de Tueste · primera capa visual.
 * Navegación, atmósfera global, hero y todas las secciones públicas ya
 * implementadas (Escucha, Origen, Música, Barista, En Vivo, Adopta,
 * Tienda, Negocios, Mercado de Origen y Comunidad), replicando el mockup
 * de referencia, más el footer público que cierra la experiencia.
 *
 * El SkipLink va ANTES del Navbar: es el primer elemento alcanzable con
 * Tab. Navbar lo marca inert (junto con `contenido-principal`) mientras
 * el menú móvil está abierto, para que el foco permanezca en el diálogo.
 */
export default function Home() {
  return (
    <>
      <SkipLink />
      <Navbar />
      <div id="contenido-principal">
        <Atmosphere />
        <main id="contenido" tabIndex={-1}>
          <Hero />
          <Manifiesto />
          <EditorialTicker variant="amber" />
          <ListeningExperience />
        </main>
        <Footer />
      </div>
    </>
  );
}
