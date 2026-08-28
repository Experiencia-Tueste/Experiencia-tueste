import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import { AdminModulePage } from '../module-page';

export const dynamic = 'force-dynamic';

export default async function SubastasPage() {
  const admin = await requireCapability('auctions.read');
  return (
    <AdminShell admin={admin} currentPath="/admin/subastas">
      <main className="admin-module-main">
        <AdminModulePage
          eyebrow="TUESTE · SUBASTAS"
          title="Subastas"
          description="Consulta de lotes y ofertas; la operación queda bloqueada hasta aprobación legal."
          capability="auctions.read"
        />
      </main>
    </AdminShell>
  );
}
