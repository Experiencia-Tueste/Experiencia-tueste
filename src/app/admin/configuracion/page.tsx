import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import { AdminModulePage } from '../module-page';

export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage() {
  const admin = await requireCapability('config.manage');
  return (
    <AdminShell admin={admin} currentPath="/admin/configuracion">
      <main className="admin-module-main">
        <AdminModulePage
          eyebrow="TUESTE · PLATAFORMA"
          title="Configuración"
          description="Marca, contactos, integraciones y referencias de cupones."
          capability="config.manage"
        />
      </main>
    </AdminShell>
  );
}
