import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import { AdminModulePage } from '../module-page';

export const dynamic = 'force-dynamic';

export default async function AnaliticaPage() {
  const admin = await requireCapability('analytics.read');
  return (
    <AdminShell admin={admin} currentPath="/admin/analitica">
      <main className="admin-module-main">
        <AdminModulePage
          eyebrow="TUESTE · MEDICIÓN"
          title="Embudo y analítica"
          description="Eventos del sitio, fuentes, embudo y métricas agregadas."
          capability="analytics.read"
        />
      </main>
    </AdminShell>
  );
}
