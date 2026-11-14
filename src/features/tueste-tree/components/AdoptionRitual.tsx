'use client';

import { useState } from 'react';
import {
  RITUAL_LEVEL_HINT,
  RITUAL_LEVEL_LABEL,
  RITUAL_NAME_HINT,
  RITUAL_NAME_LABEL,
  RITUAL_STEPS,
  RITUAL_TREE_INTRO,
} from '../data/content';
import { getInsignia, insigniaParaCantidad } from '../data/insignias';
import { MAX_ARBOLES_POR_COMPRA } from '../purchase';
import CertificadoBitacora from './CertificadoBitacora';
import InsigniaOptions from './InsigniaOptions';
import TreeGrove from './TreeGrove';
import TuesteTreeEyebrow from './TuesteTreeEyebrow';
import styles from '../tueste-tree.module.css';

/** Estados locales del ritual: un solo paso visible a la vez. */
type PasoRitual = 'cultivo' | 'nombre' | 'nivel' | 'certificado';

/**
 * Ritual de adopción por etapas reales de interfaz (patrón del mockup):
 * 1) elegir árbol → 2) nombrarlo → 3) elegir cuántos árboles (la
 * insignia sale de la cantidad) → 4) certificado, bitácora e «Ir a
 * pagar». Nunca se muestran los pasos completos a la vez. El pago ocurre
 * en la tienda Tueste Co; aquí no hay checkout.
 */
export default function AdoptionRitual() {
  const [paso, setPaso] = useState<PasoRitual>('cultivo');
  const [arbolId, setArbolId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [cantidadTexto, setCantidadTexto] = useState('1');

  const cantidad = /^[0-9]+$/.test(cantidadTexto) ? Number(cantidadTexto) : Number.NaN;
  const cantidadValida =
    Number.isInteger(cantidad) && cantidad >= 1 && cantidad <= MAX_ARBOLES_POR_COMPRA;
  const insignia = cantidadValida ? insigniaParaCantidad(cantidad) : undefined;

  const pasoActual = RITUAL_STEPS.find((s) => s.num === pasoNumero(paso));

  function pasoNumero(p: PasoRitual): string {
    return p === 'cultivo' ? '01' : p === 'nombre' ? '02' : p === 'nivel' ? '03' : '04';
  }

  const reiniciar = () => {
    setPaso('cultivo');
    setArbolId(null);
    setNombre('');
    setCantidadTexto('1');
  };

  return (
    <div className={styles.ritual}>
      <ol className={styles.ritualSteps} aria-label="Pasos del ritual de adopción">
        {RITUAL_STEPS.map((pasoItem) => {
          const orden = ['01', '02', '03'].indexOf(pasoItem.num);
          const actual = ['01', '02', '03'].indexOf(pasoActual?.num ?? '04');
          const completado = orden < actual;
          return (
            <li
              key={pasoItem.num}
              className={`${styles.ritualStep}${
                pasoItem.num === pasoActual?.num ? ` ${styles.ritualStepActive}` : ''
              }${completado ? ` ${styles.ritualStepDone}` : ''}`}
              aria-current={pasoItem.num === pasoActual?.num ? 'step' : undefined}
            >
              <span className={styles.ritualStepNum}>{pasoItem.num}</span>
              {pasoItem.titulo}
            </li>
          );
        })}
      </ol>

      {paso === 'cultivo' && (
        <section className={styles.ritualBlock} aria-labelledby="ritual-paso-01">
          <TuesteTreeEyebrow>PASO 01 · EL CULTIVO</TuesteTreeEyebrow>
          <h3 id="ritual-paso-01" className={styles.sectionTitle}>
            {RITUAL_TREE_INTRO}
          </h3>
          <p className={styles.ritualHint}>{RITUAL_NAME_HINT}</p>
          <TreeGrove
            seleccionadoId={arbolId}
            onSelect={(id) => {
              if (id) {
                setArbolId(id);
                setPaso('nombre');
              }
            }}
          />
        </section>
      )}

      {paso === 'nombre' && (
        <section className={styles.ritualBlock} aria-labelledby="ritual-paso-02">
          <TuesteTreeEyebrow>PASO 02 · EL NOMBRE</TuesteTreeEyebrow>
          <h3 id="ritual-paso-02" className={styles.sectionTitle}>
            {RITUAL_NAME_LABEL}
          </h3>
          <p className={styles.ritualHint}>Árbol seleccionado · Lote 000 Founders</p>
          <label className={styles.nameLabel} htmlFor="arbol-nombre">
            Nombre de tu árbol
          </label>
          <input
            id="arbol-nombre"
            className={styles.nameInput}
            type="text"
            value={nombre}
            maxLength={40}
            placeholder="Nombre de tu árbol"
            onChange={(event) => setNombre(event.target.value)}
          />
          <button
            type="button"
            className={styles.ctaPrimary}
            disabled={nombre.trim().length === 0}
            onClick={() => setPaso('nivel')}
          >
            Continuar
          </button>
          <button type="button" className={styles.ctaGhost} onClick={reiniciar}>
            Volver al cultivo
          </button>
        </section>
      )}

      {paso === 'nivel' && (
        <section className={styles.ritualBlock} aria-labelledby="ritual-paso-03">
          <TuesteTreeEyebrow>PASO 03 · INSIGNIA</TuesteTreeEyebrow>
          <h3 id="ritual-paso-03" className={styles.sectionTitle}>
            {RITUAL_LEVEL_LABEL}
          </h3>
          <p className={styles.ritualHint}>{RITUAL_LEVEL_HINT}</p>
          <label className={styles.nameLabel} htmlFor="arbol-cantidad">
            ¿Cuántos árboles adoptas?
          </label>
          <input
            id="arbol-cantidad"
            className={styles.nameInput}
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_ARBOLES_POR_COMPRA}
            step={1}
            value={cantidadTexto}
            aria-describedby="arbol-cantidad-insignia"
            onChange={(event) => setCantidadTexto(event.target.value)}
          />
          <p id="arbol-cantidad-insignia" className={styles.ritualHint} aria-live="polite">
            {insignia
              ? `Tu insignia: ${insignia.nombre} · ${insignia.arboles}`
              : `Escribe un número entre 1 y ${MAX_ARBOLES_POR_COMPRA}.`}
          </p>
          <InsigniaOptions
            insigniaId={insignia?.id ?? null}
            onSelect={(id) => {
              const elegida = getInsignia(id);
              if (elegida) setCantidadTexto(String(elegida.min));
            }}
          />
          <button
            type="button"
            className={styles.ctaPrimary}
            disabled={!cantidadValida}
            onClick={() => setPaso('certificado')}
          >
            Continuar
          </button>
          <button type="button" className={styles.ctaGhost} onClick={reiniciar}>
            Volver al inicio
          </button>
        </section>
      )}

      {paso === 'certificado' && arbolId && cantidadValida && (
        <CertificadoBitacora
          arbolId={arbolId}
          nombre={nombre.trim()}
          cantidad={cantidad}
          onRestart={reiniciar}
        />
      )}
    </div>
  );
}
