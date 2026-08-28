import { requireCapability } from '@/lib/auth/authorization';
import { AdminShell } from '../AdminShell';
import { AdminModulePage } from '../module-page';

export const dynamic = 'force-dynamic';

export default async function EventosPage() {
  const admin = await requireCapability('events.read');
  return (
    <AdminShell admin={admin} currentPath="/admin/eventos">
      <main className="admin-module-main">
        <AdminModulePage
          eyebrow="TUESTE · EVENTOS"
          title="Boletería y eventos"
          description="Eventos, reservas, asistentes, QR y check-in."
          capability="events.read"
        />
      </main>
    </AdminShell>
  );
}
