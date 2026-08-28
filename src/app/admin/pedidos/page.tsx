import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import { AdminModulePage } from '../module-page';

export const dynamic = 'force-dynamic';

export default async function PedidosPage() {
  const admin = await requireCapability('orders.read');
  return (
    <AdminShell admin={admin} currentPath="/admin/pedidos">
      <main className="admin-module-main">
        <AdminModulePage
          eyebrow="TUESTE · OPERACIÓN"
          title="Pedidos y tienda"
          description="Consulta operativa de pedidos y sincronización controlada con Shopify."
          capability="orders.read"
        />
      </main>
    </AdminShell>
  );
}
