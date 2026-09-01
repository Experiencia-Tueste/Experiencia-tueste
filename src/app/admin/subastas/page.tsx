import { requireCapability } from '@/lib/auth/authorization';
import { getAuctionWorkspace } from '@/features/admin/operations-service';
import { AUCTION_STATUSES, canTransitionAuction } from '@/features/admin/operations-schemas';
import { AdminShell } from '../AdminShell';
import {
  CardGrid,
  currency,
  dateTime,
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
import { changeAuctionStatusAction, createAuctionAction, recordAuctionBidAction } from './actions';
import styles from '../operations.module.css';

export const dynamic = 'force-dynamic';

export default async function SubastasPage() {
  const admin = await requireCapability('auctions.read');
  const workspace = await getAuctionWorkspace(admin);
  const canManage = admin.capabilities.includes('auctions.manage');
  const highest = workspace.bids.reduce((value, bid) => Math.max(value, bid.amountCents), 0);
  return (
    <AdminShell admin={admin} currentPath="/admin/subastas">
      <main className="admin-module-main">
        <ModuleHeader
          eyebrow="TUESTE · SUBASTAS"
          title="Subastas"
          description="Lotes, ventanas de apertura y ledger inmutable de ofertas con control administrativo."
        />
        <Stats>
          <Stat value={workspace.auctions.length} label="Subastas" hint="Histórico" />
          <Stat
            value={workspace.auctions.filter((item) => item.status === 'open').length}
            label="Abiertas"
            hint="Reciben ofertas"
          />
          <Stat value={workspace.bids.length} label="Ofertas" hint="Ledger inmutable" />
          <Stat value={currency(highest)} label="Oferta máxima" hint="Registrada" />
        </Stats>
        <div className={styles.notice}>
          La administración está lista, pero la apertura pública debe permanecer sujeta a aprobación
          legal, términos publicados y validación de identidad de los participantes.
        </div>
        {canManage ? (
          <Panel
            title="Preparar subasta"
            description="Toda subasta inicia como borrador y debe aprobarse antes de abrirse."
          >
            <form action={createAuctionAction} className={styles.formGrid}>
              <Select label="Lote agrícola opcional" name="lotId">
                <option value="">Sin vínculo</option>
                {workspace.lots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.code}
                  </option>
                ))}
              </Select>
              <Field label="Nombre de la subasta" name="title" required />
              <Field label="Apertura" name="startsAt" type="datetime-local" required />
              <Field label="Cierre" name="endsAt" type="datetime-local" required />
              <Field
                label="Reserva en centavos COP"
                name="reserveCents"
                type="number"
                min="1"
                required
              />
              <Field label="Razón administrativa" name="reason" required minLength={3} />
              <div className={styles.wide}>
                <PrimaryButton>Crear borrador</PrimaryButton>
              </div>
            </form>
          </Panel>
        ) : null}
        <Panel
          title="Lotes en subasta"
          description="Estados controlados y ofertas siempre visibles para auditoría."
        >
          {workspace.auctions.length === 0 ? (
            <EmptyState title="No hay subastas">
              Crea el primer borrador para iniciar la preparación.
            </EmptyState>
          ) : (
            <CardGrid>
              {workspace.auctions.map((auction) => {
                const bids = workspace.bids.filter((bid) => bid.auctionId === auction.id);
                const topBid = bids[0];
                const nextStates = AUCTION_STATUSES.filter((state) =>
                  canTransitionAuction(auction.status, state),
                );
                return (
                  <RecordCard key={auction.id}>
                    <div className={styles.cardHeader}>
                      <div>
                        <h3>{auction.title}</h3>
                        <p className={styles.meta}>
                          {dateTime(auction.startsAt)} → {dateTime(auction.endsAt)}
                        </p>
                      </div>
                      <StatusBadge status={auction.status} />
                    </div>
                    <div className={styles.metaRow}>
                      <div>
                        <span>Reserva</span>
                        <strong>{currency(auction.reserveCents)}</strong>
                      </div>
                      <div>
                        <span>Mayor oferta</span>
                        <strong>{currency(topBid?.amountCents)}</strong>
                      </div>
                      <div>
                        <span>Ofertas</span>
                        <strong>{bids.length}</strong>
                      </div>
                    </div>
                    {canManage && nextStates.length ? (
                      <form action={changeAuctionStatusAction} className={styles.actionForm}>
                        <input type="hidden" name="id" value={auction.id} />
                        <input type="hidden" name="from" value={auction.status} />
                        <Select label="Estado" name="to">
                          {nextStates.map((state) => (
                            <option key={state}>{state}</option>
                          ))}
                        </Select>
                        <Field label="Razón" name="reason" required minLength={3} />
                        <GhostButton />
                      </form>
                    ) : null}
                    {canManage && auction.status === 'open' ? (
                      <form action={recordAuctionBidAction} className={styles.stack}>
                        <input type="hidden" name="auctionId" value={auction.id} />
                        <div className={styles.formGrid}>
                          <Field label="Participante" name="bidderName" required />
                          <Field label="Correo" name="bidderEmail" type="email" required />
                          <Field
                            label="Oferta en centavos COP"
                            name="amountCents"
                            type="number"
                            min="1"
                            required
                          />
                          <Field label="Razón" name="reason" required minLength={3} />
                        </div>
                        <GhostButton>Registrar oferta verificada</GhostButton>
                      </form>
                    ) : null}
                    {bids.length ? (
                      <div className={styles.stack}>
                        {bids.map((bid) => (
                          <p className={styles.muted} key={bid.id}>
                            <strong>{currency(bid.amountCents)}</strong> · {bid.bidderName} ·{' '}
                            {dateTime(bid.createdAt)}
                          </p>
                        ))}
                      </div>
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
