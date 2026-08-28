import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import { AdminModulePage } from '../module-page';

export const dynamic = 'force-dynamic';

export default async function ComunidadPage() {
  const admin = await requireCapability('community.read');
  return (
    <AdminShell admin={admin} currentPath="/admin/comunidad">
      <main className="admin-module-main">
        <AdminModulePage
          eyebrow="TUESTE · COMUNIDAD"
          title="Comunidad y TuesteX"
          description="Miembros, publicaciones, reportes y moderación."
          capability="community.read"
        />
      </main>
    </AdminShell>
  );
}
