'use client';

import { useState } from 'react';
import { RITUAL_CONFIRM } from '../data/content';
import { insigniaParaCantidad } from '../data/insignias';
import { getArbol } from '../data/cultivo';
import { goTo } from '../navigate';
import styles from '../tueste-tree.module.css';

export interface CertificadoBitacoraProps {
  arbolId: string;
  nombre: string;
  /** Árboles que se adoptan en esta compra. */
  cantidad: number;
  onRestart: () => void;
}

const LOGIN_URL = '/cuenta/iniciar-sesion?next=%2Ftueste-tree%2Fadoptar';
const ERROR_GENERICO = 'No pudimos preparar tu compra. Inténtalo de nuevo.';

/** Hitos estáticos de la bitácora editorial del ciclo. */
const HITOS = [
  { num: '01', titulo: 'Germinación', texto: 'La raíz encuentra su primer pulso en el lote.' },
  { num: '02', titulo: 'Floración', texto: 'El cafetal abre su tiempo más frágil.' },
  { num: '03', titulo: 'Cereza', texto: 'El color anuncia un origen en maduración.' },
  { num: '04', titulo: 'Cosecha', texto: 'Las manos convierten espera en cuidado.' },
  { num: '05', titulo: 'Tu taza', texto: 'El ciclo llega a la escucha cotidiana.' },
] as const;

/**
 * Vista previa del certificado de Guardián + bitácora editorial. Aparece
 * al completar árbol, nombre y cantidad. «Ir a pagar» guarda la elección
 * como adopción pendiente y lleva a la tienda Tueste Co con el carrito ya
 * armado; Experiencia no cobra ni pide datos de pago.
 */
export default function CertificadoBitacora({
  arbolId,
  nombre,
  cantidad,
  onRestart,
}: CertificadoBitacoraProps) {
  const arbol = getArbol(arbolId);
  const insignia = insigniaParaCantidad(cantidad);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function irAPagar() {
    setEnviando(true);
    setError(null);
    try {
      const response = await fetch('/api/tree/adoption', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ treeId: arbolId, treeName: nombre, treesCount: cantidad }),
      });
      if (response.status === 401) {
        goTo(LOGIN_URL);
        return;
      }
      const body = (await response.json().catch(() => null)) as {
        adoption?: { payUrl?: string };
        message?: string;
      } | null;
      if (response.ok && body?.adoption?.payUrl) {
        goTo(body.adoption.payUrl);
        return;
      }
      setError(body?.message ?? ERROR_GENERICO);
    } catch {
      setError(ERROR_GENERICO);
    }
    setEnviando(false);
  }

  return (
    <div className={styles.certWrap}>
      <section className={styles.certificate} aria-labelledby="cert-titulo">
        <p className={styles.certKicker}>CERTIFICADO DE GUARDIÁN · VISTA PREVIA</p>
        <h3 id="cert-titulo" className={styles.certTitle}>
          {nombre || 'Tu árbol'}
        </h3>
        <dl className={styles.certData}>
          <div>
            <dt>Árbol</dt>
            <dd>#{arbol?.numero ?? arbolId}</dd>
          </div>
          <div>
            <dt>Lote</dt>
            <dd>Lote 000 Founders</dd>
          </div>
          <div>
            <dt>Árboles</dt>
            <dd>{cantidad}</dd>
          </div>
          <div>
            <dt>Insignia</dt>
            <dd>{insignia ? `${insignia.nombre} · ${insignia.arboles}` : '—'}</dd>
          </div>
        </dl>
        <p className={styles.certNote}>{RITUAL_CONFIRM}</p>
        <button
          type="button"
          className={styles.ctaPrimary}
          onClick={irAPagar}
          disabled={enviando}
          data-commercial-intent="tree-adoption-pay"
        >
          {enviando ? 'Preparando tu compra…' : 'Ir a pagar'}
        </button>
        <p className={styles.certNote}>
          Pagas en la tienda Tueste Co. Aquí solo guardamos tu elección.
        </p>
        {error && (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
      </section>

      <section className={styles.bitacora} aria-labelledby="bitacora-titulo">
        <h3 id="bitacora-titulo" className={styles.bitacoraTitle}>
          Bitácora del ciclo
        </h3>
        <ol className={styles.bitacoraList}>
          {HITOS.map((hito) => (
            <li key={hito.num} className={styles.bitacoraItem}>
              <span className={styles.bitacoraNum} aria-hidden="true">
                {hito.num}
              </span>
              <div>
                <strong>{hito.titulo}</strong>
                <p>{hito.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <button type="button" className={styles.ctaGhost} onClick={onRestart}>
        Empezar de nuevo
      </button>
    </div>
  );
}
