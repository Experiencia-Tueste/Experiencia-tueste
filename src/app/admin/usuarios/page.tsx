import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import { AdminModulePage } from '../module-page';

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  const admin = await requireCapability('users.manage');
  return (
    <AdminShell admin={admin} currentPath="/admin/usuarios">
      <main className="admin-module-main">
        <AdminModulePage
          eyebrow="TUESTE · PLATAFORMA"
          title="Usuarios y roles"
          description="Invitaciones, estado de acceso, roles y alcance por vendedor."
          capability="users.manage"
        />
      </main>
    </AdminShell>
  );
}
