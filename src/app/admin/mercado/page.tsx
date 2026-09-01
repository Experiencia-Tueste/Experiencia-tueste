import { requireCapability } from '@/lib/auth/authorization';
import { getMarketWorkspace } from '@/features/admin/operations-service';
import { MARKET_STATUSES, canTransitionMarket } from '@/features/admin/operations-schemas';
import { AdminShell } from '../AdminShell';
import {
  CardGrid,
  currency,
  EmptyState,
  Field,
  GhostButton,
  ModuleHeader,
  Panel,
  PrimaryButton,
  RecordCard,
  Select,
  Stat,
  Stats,
  StatusBadge,
} from '../_components/AdminUi';
import { changeMarketStatusAction, createMarketListingAction } from './actions';
import styles from '../operations.module.css';

export const dynamic = 'force-dynamic';

export default async function MercadoPage() {
  const admin = await requireCapability('market.read');
  const workspace = await getMarketWorkspace(admin);
  const canManage = admin.capabilities.includes('market.manage');
  const published = workspace.listings.filter((item) => item.status === 'published').length;
  const inventory = workspace.listings
    .filter((item) => item.status === 'published')
    .reduce((sum, item) => sum + item.inventory, 0);
  return (
    <AdminShell admin={admin} currentPath="/admin/mercado">
      <main className="admin-module-main">
        <ModuleHeader
          eyebrow="TUESTE · MERCADO"
          title="Mercado y vendedores"
          description="Catálogo gobernado de vendedores, disponibilidad, precios y aprobación editorial."
        />
        <Stats>
          <Stat value={workspace.vendors.length} label="Vendedores" hint="Persistidos" />
          <Stat
            value={workspace.listings.length}
            label="Publicaciones"
            hint="En todos los estados"
          />
          <Stat value={published} label="Publicadas" hint="Visibles comercialmente" />
          <Stat value={inventory} label="Inventario" hint="Unidades disponibles" />
        </Stats>
        {canManage ? (
          <Panel
            title="Nueva publicación"
            description="El producto comienza como borrador y requiere revisión antes de publicarse."
          >
            {workspace.vendors.length === 0 ? (
              <EmptyState title="No hay vendedores">
                Registra un vendedor desde Usuarios y roles antes de crear su catálogo.
              </EmptyState>
            ) : (
              <form action={createMarketListingAction} className={styles.formGrid}>
                <Select label="Vendedor" name="vendorId" required>
                  <option value="">Seleccionar</option>
                  {workspace.vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </Select>
                <Field label="Título" name="title" required />
                <Field
                  label="Categoría"
                  name="category"
                  placeholder="Café, experiencia, objeto…"
                  required
                />
                <Field
                  label="Precio en centavos COP"
                  name="priceCents"
                  type="number"
                  min="1"
                  required
                />
                <Field
                  label="Inventario"
                  name="inventory"
                  type="number"
                  min="0"
                  defaultValue="0"
                  required
                />
                <Field label="Notas editoriales" name="notes" />
                <Field label="Razón administrativa" name="reason" required minLength={3} />
                <div className={styles.wide}>
                  <PrimaryButton>Crear borrador</PrimaryButton>
                </div>
              </form>
            )}
          </Panel>
        ) : null}
        <Panel
          title="Catálogo operativo"
          description="Cada ficha conserva su vendedor, inventario, precio y estado editorial."
        >
          {workspace.listings.length === 0 ? (
            <EmptyState title="Catálogo vacío">
              Crea la primera ficha de producto o experiencia.
            </EmptyState>
          ) : (
            <CardGrid>
              {workspace.listings.map((listing) => {
                const vendor = workspace.vendors.find((item) => item.id === listing.vendorId);
                const nextStates = MARKET_STATUSES.filter((status) =>
                  canTransitionMarket(listing.status, status),
                );
                return (
                  <RecordCard key={listing.id}>
                    <div className={styles.cardHeader}>
                      <div>
                        <h3>{listing.title}</h3>
                        <p className={styles.meta}>
                          {vendor?.name ?? 'Vendedor'} · {listing.category}
                        </p>
                      </div>
                      <StatusBadge status={listing.status} />
                    </div>
                    <div className={styles.metaRow}>
                      <div>
                        <span>Precio</span>
                        <strong>{currency(listing.priceCents)}</strong>
                      </div>
                      <div>
                        <span>Inventario</span>
                        <strong>{listing.inventory}</strong>
                      </div>
                    </div>
                    {listing.notes ? <p className={styles.muted}>{listing.notes}</p> : null}
                    {canManage && nextStates.length ? (
                      <form action={changeMarketStatusAction} className={styles.actionForm}>
                        <input type="hidden" name="id" value={listing.id} />
                        <input type="hidden" name="from" value={listing.status} />
                        <Select label="Estado" name="to" defaultValue={listing.status}>
                          {nextStates.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </Select>
                        <Field label="Razón" name="reason" minLength={3} required />
                        <GhostButton />
                      </form>
                    ) : null}
                  </RecordCard>
                );
              })}
            </CardGrid>
          )}
        </Panel>
      </main>
    </AdminShell>
  );
}
