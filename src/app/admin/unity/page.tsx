import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import { AdminModulePage } from '../module-page';

export const dynamic = 'force-dynamic';

export default async function UnityPage() {
  const admin = await requireCapability('unity.read');
  return (
    <AdminShell admin={admin} currentPath="/admin/unity">
      <main className="admin-module-main">
        <AdminModulePage
          eyebrow="TUESTE · UNITY"
          title="Servicios B2B"
          description="Leads, paquetes, propuestas y seguimiento comercial."
          capability="unity.read"
        />
      </main>
    </AdminShell>
  );
}
