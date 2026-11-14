'use client';

import { RITUAL_CONFIRM } from '../data/content';
import { getInsignia } from '../data/insignias';
import { getArbol } from '../data/cultivo';
import styles from '../tueste-tree.module.css';

export interface CertificadoBitacoraProps {
  arbolId: string;
  nombre: string;
  insigniaId: string;
  onRestart: () => void;
}

/** Hitos estáticos de la bitácora editorial del ciclo. */
const HITOS = [
  { num: '01', titulo: 'Germinación', texto: 'La raíz encuentra su primer pulso en el lote.' },
  { num: '02', titulo: 'Floración', texto: 'El cafetal abre su tiempo más frágil.' },
  { num: '03', titulo: 'Cereza', texto: 'El color anuncia un origen en maduración.' },
  { num: '04', titulo: 'Cosecha', texto: 'Las manos convierten espera en cuidado.' },
  { num: '05', titulo: 'Tu taza', texto: 'El ciclo llega a la escucha cotidiana.' },
] as const;

/**
 * Vista previa local del certificado de Guardián + bitácora editorial
 * estática. Solo aparece al completar árbol, nombre e insignia. Todo es
 * demostrativo; el aviso de que no es una compra es explícito.
 */
export default function CertificadoBitacora({
  arbolId,
  nombre,
  insigniaId,
  onRestart,
}: CertificadoBitacoraProps) {
  const arbol = getArbol(arbolId);
  const insignia = getInsignia(insigniaId);

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
            <dt>Insignia</dt>
            <dd>{insignia ? `${insignia.nombre} · ${insignia.arboles}` : insigniaId}</dd>
          </div>
        </dl>
        <p className={styles.certNote}>{RITUAL_CONFIRM}</p>
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
