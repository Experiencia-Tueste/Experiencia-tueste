import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import { AdminModulePage } from '../module-page';

export const dynamic = 'force-dynamic';

export default async function RadioPage() {
  const admin = await requireCapability('radio.read');
  return (
    <AdminShell admin={admin} currentPath="/admin/radio">
      <main className="admin-module-main">
        <AdminModulePage
          eyebrow="TUESTE · RADIO ORIGEN"
          title="Radio Origen B2B"
          description="Empresas, canales, planes y suscripciones del servicio B2B."
          capability="radio.read"
        />
      </main>
    </AdminShell>
  );
}
