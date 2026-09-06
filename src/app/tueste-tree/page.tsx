import type { Metadata } from 'next';
import DashboardCultivo from '@/features/tueste-tree/components/DashboardCultivo';
import DashboardEcosistema from '@/features/tueste-tree/components/DashboardEcosistema';
import DashboardHeader from '@/features/tueste-tree/components/DashboardHeader';
import DashboardLotes from '@/features/tueste-tree/components/DashboardLotes';
import DashboardModelo from '@/features/tueste-tree/components/DashboardModelo';
import DashboardMyTree from '@/features/tueste-tree/components/DashboardMyTree';
import DashboardNavCards from '@/features/tueste-tree/components/DashboardNavCards';
import DashboardProgress from '@/features/tueste-tree/components/DashboardProgress';
import DashboardPromesa from '@/features/tueste-tree/components/DashboardPromesa';
import DashboardSections from '@/features/tueste-tree/components/DashboardSections';
import TuesteTreePageShell from '@/features/tueste-tree/components/TuesteTreePageShell';

/**
 * Metadata del dashboard de Tueste Tree.
 */
export const metadata: Metadata = {
  title: 'Tueste Tree · Panel de adopción',
  description:
    'Panel de adopción de Tueste Tree: los primeros 10.200 árboles fundacionales del Lote 000, seis niveles para cofundar el origen.',
};

/**
 * /tueste-tree — dashboard de aplicación (paridad con la referencia de
 * José): cabecera compacta, progreso del proyecto, accesos del panel,
 * Mi árbol, cultivo, lote/drops, modelo, ecosistema, promesa, territorio
 * y comunidad. Sin hero de marketing, sin imagen de cafetal en el
 * primer bloque, sin pagos ni datos dinámicos.
 */
export default function TuesteTreePage() {
  return (
    <TuesteTreePageShell active="dashboard">
      <DashboardHeader />
      <DashboardProgress />
      <DashboardNavCards />
      <DashboardMyTree />
      <DashboardCultivo />
      <DashboardSections />
      <DashboardLotes />
      <DashboardModelo />
      <DashboardEcosistema />
      <DashboardPromesa />
    </TuesteTreePageShell>
  );
}
