'use client';

import { useState } from 'react';
import {
  AVISO_DEMO,
  AVISO_LEGAL,
  BENEFICIOS,
  BITACORA_DEMO,
  DEMO_ADOPCION,
  LOTE_FUNDADOR,
  MENSAJE_ACTIVACION,
  PRECIO_ADOPCION,
} from '@/features/adoption';
import type { Beneficio } from '@/features/adoption';
import { Arbol, LotePaisaje } from './LoteVisual';
import Reveal from './Reveal';
import SectionGhost from './SectionGhost';
import styles from './TuesteTree.module.css';

type Vista = 'oferta' | 'activacion' | 'panel';

/** Icono SVG determinista de cada beneficio (paths del mockup). */
function IconoBeneficio({ id }: { id: Beneficio['icono'] }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {id === 'cert' ? <path d="M5 13l4 4L19 7" /> : null}
      {id === 'fotos' ? (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 15l5-5 4 4 5-6 4 5" />
        </>
      ) : null}
      {id === 'frecuencia' ? (
        <>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </>
      ) : null}
      {id === 'cafe' ? (
        <>
          <path d="M3 7l9-4 9 4-9 4-9-4z" />
          <path d="M3 7v7l9 4 9-4V7" />
        </>
      ) : null}
    </svg>
  );
}

/** Topografía decorativa de la sección (del mockup), aria-hidden. */
function Topografia() {
  return (
    <svg
      viewBox="0 0 400 225"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="rgba(255,232,191,.12)" strokeWidth="1.1">
        <path d="M60 180c30-38 74-52 118-46s86 34 128 22 62-48 78-84" />
        <path d="M40 196c38-46 90-64 142-56s100 40 150 24 70-56 84-98" />
        <path d="M84 166c24-30 60-42 96-37s70 27 104 17 50-38 62-68" />
        <path d="M110 152c18-22 44-31 71-27s52 20 77 12 37-28 46-50" />
      </g>
      <circle cx="205" cy="112" r="4" fill="rgba(251,169,34,.7)" />
    </svg>
  );
}

/** Anillo de progreso del panel demo (62 % fijo, del mockup). */
const RING_C = 276.46; // 2·π·44
const RING_OFF = 105.05; // C·(1 − 0.62)

/**
 * Sección «06 / TUESTE TREE» · Adopta un árbol (#tueste-tree).
 * Un único componente cliente con tres vistas locales: Oferta (contenido
 * público), Activación (formulario visual con validación nativa que no
 * envía ni guarda datos) y Panel demo (dashboard estático rotulado como
 * demostración, sin datos personales reales). Sin autenticación, pagos,
 * persistencia ni adopciones reales; el aviso legal siempre visible.
 */
export default function TuesteTree() {
  const [vista, setVista] = useState<Vista>('oferta');
  const [anuncio, setAnuncio] = useState<string | null>(null);

  const irA = (v: Vista, aviso: string | null) => {
    setVista(v);
    setAnuncio(aviso);
  };

  const enviarActivacion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAnuncio(MENSAJE_ACTIVACION);
  };

  return (
    <section id="tueste-tree" className={styles.section} aria-labelledby="tt-titulo">
      <SectionGhost number="06" />
      <div className={styles.topo} aria-hidden="true">
        <Topografia />
      </div>

      <Reveal>
        <div className={styles.sechead}>
          <span className={styles.secnum}>06 / TUESTE TREE</span>
        </div>
      </Reveal>
      <Reveal>
        <h2 id="tt-titulo" className={styles.title}>
          Adopta un árbol y <em>escucha cómo crece</em>
        </h2>
      </Reveal>

      {vista === 'oferta' ? (
        <Reveal>
          <div className={styles.view}>
            <p className={styles.lead}>
              No compras una planta: entras a una historia viva. Tu árbol vive en el Lote 000 de
              Finca Tres Esquinas, en las montañas del Quindío. Recibe una frecuencia propia, fotos
              del cultivo a lo largo del año y la puerta abierta para venir a caminarlo.
            </p>

            <div className={styles.grid}>
              <div className={styles.visual}>
                <LotePaisaje className={styles.visualSvg} />
                <span className={styles.vtag}>{LOTE_FUNDADOR.nombre}</span>
                <div className={styles.vfoot}>
                  {LOTE_FUNDADOR.coordenadas} · {LOTE_FUNDADOR.ubicacion} · {LOTE_FUNDADOR.altitud}
                </div>
              </div>

              <div>
                <div className={styles.benefits}>
                  {BENEFICIOS.map((b) => (
                    <div className={styles.benefit} key={b.id}>
                      <span className={styles.bi}>
                        <IconoBeneficio id={b.icono} />
                      </span>
                      <div>
                        <b>{b.titulo}</b>
                        <span>{b.descripcion}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.cta}>
                  <div className={styles.priceTag}>
                    <b>{PRECIO_ADOPCION.valor}</b>
                    <span>{PRECIO_ADOPCION.detalle}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() => irA('activacion', 'Formulario de activación.')}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M12 2l2 7h7l-6 4 2 7-5-4-5 4 2-7-6-4h7z" />
                    </svg>
                    Activar mi árbol
                  </button>
                  <button
                    type="button"
                    className={styles.ghost}
                    onClick={() => irA('panel', 'Panel de demostración del adoptante.')}
                  >
                    Ver el panel del adoptante (demo)
                  </button>
                </div>

                <p className={styles.note}>{AVISO_LEGAL}</p>
              </div>
            </div>
          </div>
        </Reveal>
      ) : null}

      {vista === 'activacion' ? (
        <Reveal>
          <div className={styles.view}>
            <div className={styles.activate}>
              <div className={styles.seed} aria-hidden="true">
                <Arbol pct={16} />
              </div>
              <h3>Activa tu árbol</h3>
              <p>
                Escribe tu nombre y correo. Es una solicitud demostrativa: el árbol se sembrará y el
                panel se abrirá solo cuando el equipo confirme la activación y el tratamiento de
                datos. No se envía ni se guarda nada en esta página.
              </p>
              <form className={styles.form} onSubmit={enviarActivacion} noValidate={false}>
                <label className={styles.field}>
                  Tu nombre
                  <input
                    type="text"
                    name="nombre"
                    required
                    autoComplete="name"
                    placeholder="Tu nombre"
                  />
                </label>
                <label className={styles.field}>
                  Tu correo
                  <input
                    type="email"
                    name="correo"
                    required
                    autoComplete="email"
                    placeholder="tu@correo.com"
                  />
                </label>
                <button type="submit" className={`${styles.btn} ${styles.btnFull}`}>
                  Sembrar mi árbol
                </button>
                <button
                  type="button"
                  className={`${styles.ghost} ${styles.back}`}
                  onClick={() => irA('oferta', 'Volviste a la oferta de adopción.')}
                >
                  Volver
                </button>
              </form>
              <p className={styles.note}>{AVISO_LEGAL}</p>
            </div>
          </div>
        </Reveal>
      ) : null}

      {vista === 'panel' ? (
        <Reveal>
          <div className={styles.view}>
            <div className={styles.dashTop}>
              <div className={styles.who}>
                <b>Hola, invitado</b>
                <span>{DEMO_ADOPCION.lote} · Finca Tres Esquinas</span>
              </div>
              <div className={styles.cert}>
                Árbol <b>{DEMO_ADOPCION.arbolId}</b>
                <br />
                Certificado <b>{DEMO_ADOPCION.certificado}</b>
                <br />
                Adoptado: {DEMO_ADOPCION.desde}
              </div>
            </div>

            <div className={styles.dashCols}>
              <div className={`${styles.panel} ${styles.treeState}`}>
                <h4>◐ Estado de tu árbol</h4>
                <div className={styles.ringwrap}>
                  <svg
                    className={styles.ring}
                    viewBox="0 0 100 100"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <defs>
                      <linearGradient id="tt-ring" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#0FA295" />
                        <stop offset="1" stopColor="#FBA922" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="rgba(255,232,191,.12)"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="url(#tt-ring)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={RING_C.toFixed(1)}
                      strokeDashoffset={RING_OFF.toFixed(1)}
                    />
                  </svg>
                  <div className={styles.plant}>
                    <Arbol pct={DEMO_ADOPCION.progreso} />
                  </div>
                </div>
                <div className={styles.pct}>{DEMO_ADOPCION.progreso}%</div>
                <div className={styles.stt}>Camino a la cosecha</div>
                <dl className={styles.meta}>
                  <div>
                    <dt>Estación</dt>
                    <dd>{DEMO_ADOPCION.estacion}</dd>
                  </div>
                  <div>
                    <dt>Salud</dt>
                    <dd>{DEMO_ADOPCION.salud}</dd>
                  </div>
                  <div>
                    <dt>Altura est.</dt>
                    <dd>{DEMO_ADOPCION.alturaEstimada}</dd>
                  </div>
                  <div>
                    <dt>Próx. foto</dt>
                    <dd>{DEMO_ADOPCION.proximaFoto}</dd>
                  </div>
                </dl>
              </div>

              <div className={styles.panel}>
                <div className={styles.bitaHead}>
                  <h3>▦ Bitácora del cultivo</h3>
                  <span className={styles.upd}>
                    ● actualizado {DEMO_ADOPCION.ultimaActualizacion}
                  </span>
                </div>
                {BITACORA_DEMO.map((l, i) => (
                  <div
                    className={`${styles.logrow}${l.hecho ? '' : ` ${styles.pending}`}`}
                    key={`${l.cuando}-${i}`}
                  >
                    <div className={styles.thumb}>
                      {l.hecho ? <LotePaisaje className={styles.thumbSvg} /> : null}
                    </div>
                    <div className={styles.ld}>
                      <span className={styles.when}>{l.cuando}</span>
                      <b>{l.titulo}</b>
                      <p>{l.nota}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className={styles.dashDisc}>{AVISO_DEMO}</p>
            <div className={styles.exitWrap}>
              <button
                type="button"
                className={styles.ghost}
                onClick={() => irA('oferta', 'Volviste a la oferta de adopción.')}
              >
                ← Volver a la adopción
              </button>
            </div>
          </div>
        </Reveal>
      ) : null}

      <p className={styles.live} role="status" aria-live="polite">
        {anuncio ?? '\u00A0'}
      </p>
    </section>
  );
}
