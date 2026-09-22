'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatoCOP } from '@/features/commerce';
import {
  AVISO_MERCADO,
  MERCADO_ACCENT,
  MERCADO_PASOS,
  MERCADO_TIPOS,
  esTipoValido,
  parsearPrecio,
} from '@/features/mercado';
import type { PublicMarketListing, PublicacionPreview } from '@/features/mercado';
import { loginPath, submitEngagement } from './engagement-client';
import { trackAnalytics } from '@/features/analytics/client';
import MercadoVisual from './MercadoVisual';
import Reveal from './Reveal';
import SectionGhost from './SectionGhost';
import styles from './MercadoOrigen.module.css';

/**
 * Sección «09 / MERCADO DE ORIGEN» (#mercado): mercado curado de marcas
 * de café colombiano con pasos del modelo de venta directa. Las consultas
 * y solicitudes de publicación se guardan para revisión comercial; no
 * crean una publicación ni un pedido por sí solas.
 */
export default function MercadoOrigen({
  listings = [],
}: {
  listings?: readonly PublicMarketListing[];
}) {
  const [anuncio, setAnuncio] = useState<string | null>(null);
  const [preview, setPreview] = useState<PublicacionPreview | null>(null);
  const [pending, setPending] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const router = useRouter();

  const categories = useMemo(
    () => Array.from(new Set(listings.map((listing) => listing.category))).sort(),
    [listings],
  );
  const origins = useMemo(
    () => Array.from(new Set(listings.map((listing) => listing.origin))).sort(),
    [listings],
  );
  const filteredListings = useMemo(
    () =>
      listings.filter(
        (listing) =>
          (categoryFilter === 'all' || listing.category === categoryFilter) &&
          (originFilter === 'all' || listing.origin === originFilter),
      ),
    [categoryFilter, listings, originFilter],
  );
  const selectedListing = listings.find((listing) => listing.id === selectedId) ?? null;

  useEffect(() => {
    const readSelection = () => {
      const value = new URLSearchParams(window.location.search).get('mercado');
      setSelectedId(listings.some((listing) => listing.id === value) ? value : null);
    };
    readSelection();
    window.addEventListener('popstate', readSelection);
    return () => window.removeEventListener('popstate', readSelection);
  }, [listings]);

  const openDetail = (listing: PublicMarketListing) => {
    const url = new URL(window.location.href);
    url.searchParams.set('mercado', listing.id);
    window.history.pushState({}, '', url);
    setSelectedId(listing.id);
  };

  const closeDetail = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('mercado');
    window.history.pushState({}, '', url);
    setSelectedId(null);
  };

  const comprar = async (item: PublicMarketListing) => {
    setPending(true);
    const result = await submitEngagement({
      type: 'market',
      reference: item.id,
      payload: {
        intent: 'availability',
        itemSlug: item.slug,
      },
    });
    setPending(false);
    if (result.kind === 'login') {
      setAnuncio('Inicia sesión con tu cuenta Tueste para consultar disponibilidad.');
      router.push(loginPath('mercado'));
      return;
    }
    if (result.kind === 'ok') {
      void trackAnalytics('market_availability_requested', { listingId: item.id });
    }
    setAnuncio(result.message);
  };

  const publicar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const marca = String(fd.get('marca') ?? '').trim();
    const responsable = String(fd.get('responsable') ?? '').trim();
    const tipo = String(fd.get('tipo') ?? '');
    const origen = String(fd.get('origen') ?? '').trim();
    const precio = parsearPrecio(String(fd.get('precio') ?? ''));
    const descripcion = String(fd.get('descripcion') ?? '').trim();
    const telefono = String(fd.get('telefono') ?? '').trim();
    const canales = String(fd.get('canales') ?? '').trim();

    if (!marca || !responsable || !esTipoValido(tipo) || !origen || precio === null) {
      setAnuncio(
        'Revisa los campos obligatorios: marca, responsable, tipo, origen y un precio válido.',
      );
      return;
    }

    const nueva: PublicacionPreview = { marca, tipo, origen, precio, descripcion };
    setPreview(nueva);
    setPending(true);
    const result = await submitEngagement({
      type: 'market',
      reference: 'seller-onboarding',
      payload: {
        intent: 'seller_application',
        brand: marca,
        responsible: responsable,
        region: origen,
        category: tipo,
        description: descripcion || undefined,
        priceCop: precio,
        phone: telefono || undefined,
        salesChannels: canales || undefined,
        consent: true,
      },
    });
    setPending(false);
    if (result.kind === 'login') {
      setAnuncio('Inicia sesión con tu cuenta Tueste para solicitar una publicación.');
      router.push(loginPath('mercado'));
      return;
    }
    if (result.kind === 'ok') {
      void trackAnalytics('seller_application_submitted', {});
    }
    setAnuncio(result.message);
  };

  return (
    <section id="mercado" className={styles.section} aria-labelledby="mercado-titulo">
      <SectionGhost number="09" />
      <Reveal>
        <div className={styles.sechead}>
          <span className={styles.secnum}>09 / MERCADO DE ORIGEN</span>
        </div>
      </Reveal>
      <Reveal>
        <h2 id="mercado-titulo" className={styles.title}>
          Vende tu café <em>aquí</em>
        </h2>
      </Reveal>
      <Reveal>
        <p className={styles.lead}>
          El mercado curado de Tueste para marcas de café colombiano: tostado, molido, en verde,
          cápsulas, métodos y accesorios. Con una suscripción de USD 10 al mes podrás publicar tu
          producto y vender directo. Tueste es el puente — la venta será tuya. Envía tu solicitud
          con la cuenta Tueste y el equipo revisará la marca antes de publicar o confirmar un paso
          comercial.
        </p>
      </Reveal>

      <Reveal>
        <div className={styles.how}>
          {MERCADO_PASOS.map((paso) => (
            <div className={styles.step} key={paso.num}>
              <b>
                {paso.num} · {paso.titulo}
              </b>
              <p>{paso.texto}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        {listings.length > 0 ? (
          <div className={styles.filters} aria-label="Filtros del mercado">
            <label className={styles.filter}>
              Categoría
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">Todas</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.filter}>
              Origen
              <select
                value={originFilter}
                onChange={(event) => setOriginFilter(event.target.value)}
              >
                <option value="all">Todos</option>
                {origins.map((origin) => (
                  <option key={origin} value={origin}>
                    {origin}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {selectedListing ? (
          <article
            className={`${styles.card} ${styles.detail}`}
            style={
              {
                '--mc':
                  MERCADO_ACCENT[selectedListing.category as keyof typeof MERCADO_ACCENT] ??
                  'var(--amber)',
              } as React.CSSProperties
            }
          >
            <div className={styles.media}>
              <MercadoVisual
                marca={selectedListing.brand}
                accent={
                  MERCADO_ACCENT[selectedListing.category as keyof typeof MERCADO_ACCENT] ?? 'amber'
                }
                imageSrc={selectedListing.imageUrl ?? undefined}
              />
            </div>
            <div className={styles.top}>
              <span className={styles.type}>{selectedListing.category}</span>
              <span className={styles.mine}>Detalle público</span>
            </div>
            <b className={styles.brand}>{selectedListing.title}</b>
            <span className={styles.o}>
              {selectedListing.brand} · {selectedListing.vendorName} · {selectedListing.origin}
            </span>
            <p className={styles.desc}>
              {selectedListing.variety} · {selectedListing.process} · {selectedListing.presentation}{' '}
              · {selectedListing.weightGrams} g
            </p>
            <div className={styles.detailMeta}>
              <span>Entrega: {selectedListing.delivery}</span>
              <span>Trazabilidad: {selectedListing.traceability}</span>
              <span>Disponibles: {selectedListing.inventory}</span>
            </div>
            <div className={styles.foot}>
              <span className={styles.price}>{formatoCOP(selectedListing.priceCents / 100)}</span>
              <button type="button" className={styles.buy} onClick={closeDetail}>
                Cerrar detalle
              </button>
            </div>
          </article>
        ) : null}

        {preview ? (
          <article
            className={styles.card}
            style={{ '--mc': 'var(--amber)' } as React.CSSProperties}
          >
            <div className={styles.media}>
              <MercadoVisual marca={preview.marca} accent={MERCADO_ACCENT[preview.tipo]} />
            </div>
            <div className={styles.top}>
              <span className={styles.type}>{preview.tipo}</span>
              <span className={styles.mine}>Tu producto · vista previa</span>
            </div>
            <b className={styles.brand}>{preview.marca}</b>
            <span className={styles.o}>{preview.origen} — Colombia</span>
            <p className={styles.desc}>{preview.descripcion || 'Sin descripción.'}</p>
            <div className={styles.foot}>
              <span className={styles.price}>{formatoCOP(preview.precio)}</span>
              <span className={styles.local}>Vista previa local</span>
            </div>
            <span className={styles.seller}>
              Vista demostrativa: la publicación se habilitará cuando el cliente confirme el flujo.
            </span>
          </article>
        ) : null}

        <div className={styles.grid}>
          {filteredListings.map((item) => (
            <article
              className={styles.card}
              key={item.id}
              style={
                {
                  '--mc':
                    MERCADO_ACCENT[item.category as keyof typeof MERCADO_ACCENT] ?? 'var(--amber)',
                } as React.CSSProperties
              }
            >
              <div className={styles.media}>
                <MercadoVisual
                  marca={item.brand}
                  accent={MERCADO_ACCENT[item.category as keyof typeof MERCADO_ACCENT] ?? 'amber'}
                  imageSrc={item.imageUrl ?? undefined}
                />
              </div>
              <div className={styles.top}>
                <span className={styles.type}>{item.category}</span>
              </div>
              <b className={styles.brand}>{item.title}</b>
              <span className={styles.o}>
                {item.brand} · {item.origin} — Colombia
              </span>
              <p className={styles.desc}>
                {item.variety} · {item.process} · {item.presentation} · {item.weightGrams} g
              </p>
              <div className={styles.foot}>
                <span className={styles.price}>{formatoCOP(item.priceCents / 100)}</span>
                <a
                  className={styles.detailLink}
                  href={`/experiencia?mercado=${item.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    openDetail(item);
                  }}
                >
                  Ver detalle
                </a>
                <button
                  type="button"
                  className={styles.buy}
                  onClick={() => comprar(item)}
                  disabled={pending}
                  data-commercial-intent={`availability-${item.slug}`}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M6 8h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Zm3 0V6a3 3 0 0 1 6 0v2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Consultar disponibilidad
                </button>
              </div>
              <span className={styles.seller}>
                Catálogo editorial · consulta revisada por Tueste
              </span>
            </article>
          ))}
        </div>
      </Reveal>

      {filteredListings.length === 0 ? (
        <div className={styles.grid}>
          <p className={styles.empty} role="status">
            {listings.length === 0
              ? 'El catálogo público se está preparando. Las publicaciones aprobadas aparecerán aquí.'
              : 'No hay productos disponibles con estos filtros.'}
          </p>
        </div>
      ) : null}

      <Reveal>
        <div className={styles.reg}>
          <div className={styles.regHead}>
            <b>Publica tu producto</b>
            <span>USD 10 / mes · solo café y relacionados</span>
          </div>
          <p>
            Completa los datos y envía una solicitud. El equipo valida cada marca antes de crear una
            publicación visible en el mercado; enviar la solicitud no genera ningún cobro.
          </p>
          <form className={styles.form} onSubmit={publicar}>
            <label className={styles.field}>
              Marca o finca *
              <input
                type="text"
                name="marca"
                required
                maxLength={40}
                placeholder="Finca El Roble"
              />
            </label>
            <label className={styles.field}>
              Responsable *
              <input type="text" name="responsable" required maxLength={160} />
            </label>
            <label className={styles.field}>
              Tipo de producto *
              <select name="tipo" required defaultValue={MERCADO_TIPOS[0]}>
                {MERCADO_TIPOS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              Origen / región *
              <input type="text" name="origen" required maxLength={30} placeholder="Quindío" />
            </label>
            <label className={styles.field}>
              Precio (COP) *
              <input
                type="text"
                name="precio"
                required
                inputMode="numeric"
                maxLength={12}
                placeholder="48.000"
              />
            </label>
            <label className={`${styles.field} ${styles.wide}`}>
              Descripción corta
              <input
                type="text"
                name="descripcion"
                maxLength={90}
                placeholder="Variedad, proceso y notas — ej: Caturra honey · panela y frutos rojos"
              />
            </label>
            <label className={styles.field}>
              Teléfono
              <input type="tel" name="telefono" maxLength={40} />
            </label>
            <label className={styles.field}>
              Canales actuales de venta
              <input type="text" name="canales" maxLength={200} placeholder="Tienda, Instagram…" />
            </label>
            <label className={`${styles.consent} ${styles.wide}`}>
              <input type="checkbox" name="consent" required />
              Acepto los términos de revisión y entiendo que la solicitud no genera cobro ni
              publicación automática.
            </label>
            <button type="submit" className={styles.pub}>
              {pending ? 'Enviando…' : 'Solicitar publicación'}
            </button>
          </form>
          <p className={styles.note}>{AVISO_MERCADO}</p>
        </div>
      </Reveal>

      <p className={styles.live} role="status" aria-live="polite">
        {anuncio ?? '\u00A0'}
      </p>
    </section>
  );
}
