import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import { AdminModulePage } from '../module-page';

export const dynamic = 'force-dynamic';

export default async function CumplimientoPage() {
  const admin = await requireCapability('tree.read');
  return (
    <AdminShell admin={admin} currentPath="/admin/cumplimiento">
      <main className="admin-module-main">
        <AdminModulePage
          eyebrow="TUESTE · FINCA"
          title="Cumplimiento y finca"
          description="Actualizaciones de finca y comunicaciones vinculadas a cada lote."
          capability="tree.read"
        />
      </main>
    </AdminShell>
  );
}
