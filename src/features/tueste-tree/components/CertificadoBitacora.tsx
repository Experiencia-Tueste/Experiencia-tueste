'use client';

import { NIVELES_FUNDACIONALES } from '../data/niveles';
import { getArbol } from '../data/cultivo';
import styles from '../tueste-tree.module.css';

export interface CertificadoBitacoraProps {
  arbolId: string;
  nombre: string;
  nivelId: string;
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
 * Certificado visual local de «socio fundador» + bitácora editorial
 * estática. Solo aparece al completar árbol, nombre y nivel. Todo es
 * demostrativo; el aviso de intención es explícito.
 */
export default function CertificadoBitacora({
  arbolId,
  nombre,
  nivelId,
  onRestart,
}: CertificadoBitacoraProps) {
  const arbol = getArbol(arbolId);
  const nivel = NIVELES_FUNDACIONALES.find((n) => n.id === nivelId);

  return (
    <div className={styles.certWrap}>
      <section className={styles.certificate} aria-labelledby="cert-titulo">
        <p className={styles.certKicker}>CERTIFICADO DE SOCIO FUNDADOR</p>
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
            <dt>Nivel</dt>
            <dd>{nivel ? `${nivel.nombre} · ${nivel.usd}` : nivelId}</dd>
          </div>
        </dl>
        <p className={styles.certNote}>
          Tu selección es una intención de adopción. El proceso formal se habilitará cuando el marco
          legal y operativo esté listo.
        </p>
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
