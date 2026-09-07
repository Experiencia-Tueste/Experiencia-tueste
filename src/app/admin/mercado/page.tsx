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
import {
  changeMarketStatusAction,
  createMarketListingAction,
  createVendorListingAction,
  submitVendorListingForReviewAction,
  updateVendorListingAction,
} from './actions';
import styles from '../operations.module.css';

export const dynamic = 'force-dynamic';

type ListingValues = {
  id?: string;
  title?: string | null;
  brand?: string | null;
  category?: string | null;
  variety?: string | null;
  process?: string | null;
  origin?: string | null;
  presentation?: string | null;
  weightGrams?: number | null;
  inventory?: number | null;
  priceCents?: number | null;
  imagePath?: string | null;
  imageSizeBytes?: number | null;
  delivery?: string | null;
  traceability?: string | null;
  notes?: string | null;
};

function ListingFields({ listing }: { listing?: ListingValues }) {
  return (
    <>
      <Field label="Título" name="title" defaultValue={listing?.title ?? ''} required />
      <Field label="Marca" name="brand" defaultValue={listing?.brand ?? ''} required />
      <Field
        label="Categoría"
        name="category"
        placeholder="Café tostado…"
        defaultValue={listing?.category ?? ''}
        required
      />
      <Field label="Variedad" name="variety" defaultValue={listing?.variety ?? ''} required />
      <Field label="Proceso" name="process" defaultValue={listing?.process ?? ''} required />
      <Field label="Origen" name="origin" defaultValue={listing?.origin ?? ''} required />
      <Field
        label="Presentación"
        name="presentation"
        placeholder="340 g, bolsa…"
        defaultValue={listing?.presentation ?? ''}
        required
      />
      <Field
        label="Peso en gramos"
        name="weightGrams"
        type="number"
        min="0"
        defaultValue={listing?.weightGrams ?? 0}
        required
      />
      <Field
        label="Precio en centavos COP"
        name="priceCents"
        type="number"
        min="1"
        defaultValue={listing?.priceCents ?? ''}
        required
      />
      <Field
        label="Inventario"
        name="inventory"
        type="number"
        min="0"
        defaultValue={listing?.inventory ?? 0}
        required
      />
      <Field
        label="Ruta de imagen en Storage (opcional)"
        name="imagePath"
        placeholder="vendors/<id>/producto.webp"
        defaultValue={listing?.imagePath ?? ''}
      />
      <Field
        label="Tamaño de imagen en bytes"
        name="imageSizeBytes"
        type="number"
        min="0"
        max="5000000"
        defaultValue={listing?.imageSizeBytes ?? 0}
      />
      <Field
        label="Entrega"
        name="delivery"
        placeholder="Envíos nacionales, tiempos…"
        defaultValue={listing?.delivery ?? ''}
        required
      />
      <Field
        label="Trazabilidad"
        name="traceability"
        placeholder="Lote, finca y respaldo…"
        defaultValue={listing?.traceability ?? ''}
        required
      />
      <Field label="Notas editoriales" name="notes" defaultValue={listing?.notes ?? ''} />
    </>
  );
}

export default async function MercadoPage() {
  const admin = await requireCapability('market.read');
  const workspace = await getMarketWorkspace(admin);
  const canManage = admin.capabilities.includes('market.manage');
  const canSelf = admin.capabilities.includes('market.self') && Boolean(admin.vendorId);
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
                <ListingFields />
                <Field label="Razón administrativa" name="reason" required minLength={3} />
                <div className={styles.wide}>
                  <PrimaryButton>Crear borrador</PrimaryButton>
                </div>
              </form>
            )}
          </Panel>
        ) : null}
        {canSelf && !canManage ? (
          <Panel
            title="Tu catálogo"
            description="Crea y edita únicamente tus borradores. Cada envío requiere revisión de Tueste."
          >
            <form action={createVendorListingAction} className={styles.formGrid}>
              <ListingFields />
              <Field label="Razón administrativa" name="reason" required minLength={3} />
              <div className={styles.wide}>
                <PrimaryButton>Crear borrador</PrimaryButton>
              </div>
            </form>
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
                    <p className={styles.muted}>
                      {listing.brand || 'Marca pendiente'} ·{' '}
                      {listing.variety || 'Variedad pendiente'} ·{' '}
                      {listing.process || 'Proceso pendiente'} ·{' '}
                      {listing.origin || 'Origen pendiente'}
                    </p>
                    <p className={styles.muted}>
                      {listing.presentation || 'Presentación pendiente'} ·{' '}
                      {listing.weightGrams || 0} g · {listing.delivery || 'Entrega pendiente'}
                    </p>
                    {canSelf &&
                    listing.vendorId === admin.vendorId &&
                    listing.status === 'draft' ? (
                      <>
                        <form action={updateVendorListingAction} className={styles.actionForm}>
                          <input type="hidden" name="id" value={listing.id} />
                          <ListingFields listing={listing} />
                          <Field label="Razón del cambio" name="reason" minLength={3} required />
                          <GhostButton>Guardar borrador</GhostButton>
                        </form>
                        <form
                          action={submitVendorListingForReviewAction}
                          className={styles.actionForm}
                        >
                          <input type="hidden" name="id" value={listing.id} />
                          <Field label="Razón de envío" name="reason" minLength={3} required />
                          <GhostButton>Enviar a revisión</GhostButton>
                        </form>
                      </>
                    ) : null}
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
