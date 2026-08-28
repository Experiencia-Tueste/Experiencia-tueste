import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import { AdminModulePage } from '../module-page';

export const dynamic = 'force-dynamic';

export default async function BackstagePage() {
  const admin = await requireCapability('backstage.read');
  return (
    <AdminShell admin={admin} currentPath="/admin/backstage">
      <main className="admin-module-main">
        <AdminModulePage
          eyebrow="TUESTE · BACKSTAGE"
          title="Backstage"
          description="Solicitudes de acceso, pases y control operativo de eventos."
          capability="backstage.read"
        />
      </main>
    </AdminShell>
  );
}
