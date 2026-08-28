import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import { AdminModulePage } from '../module-page';

export const dynamic = 'force-dynamic';

export default async function MercadoPage() {
  const admin = await requireCapability('market.read');
  return (
    <AdminShell admin={admin} currentPath="/admin/mercado">
      <main className="admin-module-main">
        <AdminModulePage
          eyebrow="TUESTE · MERCADO"
          title="Mercado y vendedores"
          description="Vendedores, fichas editoriales, disponibilidad y consultas."
          capability="market.read"
        />
      </main>
    </AdminShell>
  );
}
