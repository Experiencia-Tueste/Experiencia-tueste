'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatoCOP } from '@/features/commerce';
import {
  AVISO_MERCADO,
  MERCADO_ACCENT,
  MERCADO_ITEMS,
  MERCADO_PASOS,
  MERCADO_TIPOS,
  esTipoValido,
  parsearPrecio,
} from '@/features/mercado';
import type { MercadoItem, PublicacionPreview } from '@/features/mercado';
import { loginPath, submitEngagement } from './engagement-client';
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
export default function MercadoOrigen() {
  const [anuncio, setAnuncio] = useState<string | null>(null);
  const [preview, setPreview] = useState<PublicacionPreview | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const comprar = async (item: MercadoItem) => {
    setPending(true);
    const result = await submitEngagement({
      type: 'market',
      reference: `availability:${item.marca.toLowerCase().replace(/\\s+/g, '-')}`,
      details: `${item.marca} · ${item.tipo} · ${item.origen}`,
    });
    setPending(false);
    if (result.kind === 'login') {
      setAnuncio('Inicia sesión con tu cuenta Tueste para consultar disponibilidad.');
      router.push(loginPath('mercado'));
      return;
    }
    setAnuncio(result.message);
  };

  const publicar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const marca = String(fd.get('marca') ?? '').trim();
    const tipo = String(fd.get('tipo') ?? '');
    const origen = String(fd.get('origen') ?? '').trim();
    const precio = parsearPrecio(String(fd.get('precio') ?? ''));
    const descripcion = String(fd.get('descripcion') ?? '').trim();

    if (!marca || !esTipoValido(tipo) || !origen || precio === null) {
      setAnuncio('Revisa los campos obligatorios: marca, tipo, origen y un precio válido.');
      return;
    }

    const nueva: PublicacionPreview = { marca, tipo, origen, precio, descripcion };
    setPreview(nueva);
    setPending(true);
    const result = await submitEngagement({
      type: 'market',
      reference: 'seller-onboarding',
      details: `${marca} · ${tipo} · ${origen} · ${formatoCOP(precio)}${descripcion ? ` · ${descripcion}` : ''}`,
    });
    setPending(false);
    if (result.kind === 'login') {
      setAnuncio('Inicia sesión con tu cuenta Tueste para solicitar una publicación.');
      router.push(loginPath('mercado'));
      return;
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
        <div className={styles.grid}>
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
                Vista demostrativa: la publicación se habilitará cuando el cliente confirme el
                flujo.
              </span>
            </article>
          ) : null}

          {MERCADO_ITEMS.map((item) => (
            <article
              className={styles.card}
              key={item.marca}
              style={{ '--mc': MERCADO_ACCENT[item.tipo] } as React.CSSProperties}
            >
              <div className={styles.media}>
                <MercadoVisual
                  marca={item.marca}
                  accent={MERCADO_ACCENT[item.tipo]}
                  imageSrc={item.imageSrc}
                />
              </div>
              <div className={styles.top}>
                <span className={styles.type}>{item.tipo}</span>
              </div>
              <b className={styles.brand}>{item.marca}</b>
              <span className={styles.o}>{item.origen} — Colombia</span>
              <p className={styles.desc}>{item.descripcion}</p>
              <div className={styles.foot}>
                <span className={styles.price}>{formatoCOP(item.precio)}</span>
                <button
                  type="button"
                  className={styles.buy}
                  onClick={() => comprar(item)}
                  disabled={pending}
                  data-commercial-intent={`availability-${item.marca.toLowerCase().replace(/\s+/g, '-')}`}
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

      <Reveal>
        <div className={styles.reg}>
          <div className={styles.regHead}>
            <b>Publica tu producto</b>
            <span>USD 10 / mes · solo café y relacionados</span>
          </div>
          <p>
            Completa los datos y envía una solicitud. El equipo valida cada marca antes de crear una
            publicación visible en el mercado.
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
