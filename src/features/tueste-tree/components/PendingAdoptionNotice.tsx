'use client';

import { useEffect, useState } from 'react';
import styles from '../tueste-tree.module.css';

interface PendingAdoption {
  treeNumber: string;
  treeName: string;
  treesCount: number;
  insignia: string | null;
  payUrl: string | null;
}

/**
 * Aviso de adopción pendiente de pago en «Mi árbol». El tablero es una
 * página pública y estática, así que el estado del cliente se consulta
 * desde el navegador. Sin sesión, sin adopción pendiente o ante cualquier
 * error no se muestra nada: el tablero queda como siempre.
 */
export default function PendingAdoptionNotice() {
  const [adoption, setAdoption] = useState<PendingAdoption | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/tree/adoption')
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { adoption?: PendingAdoption | null } | null) => {
        if (active && body?.adoption) setAdoption(body.adoption);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (!adoption) return null;

  const arboles = adoption.treesCount === 1 ? '1 árbol' : `${adoption.treesCount} árboles`;

  return (
    <div className={styles.pendingNotice} role="status">
      <strong>Tu adopción está pendiente de pago</strong>
      <p>
        {adoption.treeName} · árbol #{adoption.treeNumber} · {arboles}
        {adoption.insignia ? ` · Insignia ${adoption.insignia}` : ''}
      </p>
      {adoption.payUrl ? (
        <a
          className={styles.ctaPrimary}
          href={adoption.payUrl}
          data-commercial-intent="tree-adoption-complete-payment"
        >
          Completar pago <span aria-hidden="true">↗</span>
        </a>
      ) : (
        <p>La tienda no está disponible en este momento. Inténtalo más tarde.</p>
      )}
      <p>Se activa cuando la tienda Tueste Co confirme tu pago.</p>
    </div>
  );
}
