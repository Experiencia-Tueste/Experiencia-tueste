import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import { AdminModulePage } from '../module-page';

export const dynamic = 'force-dynamic';

export default async function AuditoriaPage() {
  const admin = await requireCapability('audit.read');
  return (
    <AdminShell admin={admin} currentPath="/admin/auditoria">
      <main className="admin-module-main">
        <AdminModulePage
          eyebrow="TUESTE · TRAZABILIDAD"
          title="Auditoría"
          description="Historial inmutable de las acciones administrativas relevantes."
          capability="audit.read"
        />
      </main>
    </AdminShell>
  );
}
