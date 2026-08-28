import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import { AdminModulePage } from '../module-page';

export const dynamic = 'force-dynamic';

export default async function AdopcionesPage() {
  const admin = await requireCapability('tree.read');
  return (
    <AdminShell admin={admin} currentPath="/admin/adopciones">
      <main className="admin-module-main">
        <AdminModulePage
          eyebrow="TUESTE · TREE"
          title="Adopciones"
          description="Seguimiento operativo de lotes, árboles y adoptantes."
          capability="tree.read"
        />
      </main>
    </AdminShell>
  );
}
