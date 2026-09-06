import type { Metadata } from 'next';
import AdoptionHero from '@/features/tueste-tree/components/AdoptionHero';
import AdoptionRitual from '@/features/tueste-tree/components/AdoptionRitual';
import ModeloFundacional from '@/features/tueste-tree/components/ModeloFundacional';
import PromesaEcosistema from '@/features/tueste-tree/components/PromesaEcosistema';
import TuesteTreePageShell from '@/features/tueste-tree/components/TuesteTreePageShell';
import styles from '@/features/tueste-tree/tueste-tree.module.css';

/**
 * Metadata del flujo de adopción de Tueste Tree.
 */
export const metadata: Metadata = {
  title: 'Adopta un árbol · Tueste Tree',
  description:
    'Adopta un árbol real del Lote 000 Founders en Finca Tres Esquinas y cofunda el origen: elige tu vínculo y sigue su ciclo hasta la taza.',
};

/**
 * /tueste-tree/adoptar — ritual de adopción/cofundación (paridad con la
 * referencia de José): hero de dos columnas con métricas, ritual por
 * etapas (cultivo → nombre → nivel → certificado/bitácora), modelo
 * fundacional informativo y cierre de promesa/ecosistema. Sin pagos.
 */
export default function AdoptarPage() {
  return (
    <TuesteTreePageShell active="adoptar" variant="adoption">
      <AdoptionHero />
      <div id="cultivo" tabIndex={-1} className={styles.ritualWrap}>
        <AdoptionRitual />
      </div>
      <div id="modelo" tabIndex={-1}>
        <ModeloFundacional />
      </div>
      <PromesaEcosistema />
    </TuesteTreePageShell>
  );
}
