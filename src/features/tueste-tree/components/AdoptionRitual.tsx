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
import CertificadoBitacora from './CertificadoBitacora';
import CofoundingLevels from './CofoundingLevels';
import TreeGrove from './TreeGrove';
import TuesteTreeEyebrow from './TuesteTreeEyebrow';
import styles from '../tueste-tree.module.css';

/** Estados locales del ritual: un solo paso visible a la vez. */
type PasoRitual = 'cultivo' | 'nombre' | 'nivel' | 'certificado';

/**
 * Ritual de adopción por etapas reales de interfaz (patrón del mockup):
 * 1) elegir árbol → 2) nombrarlo → 3) elegir vínculo/nivel → 4)
 * certificado y bitácora. Nunca se muestran los pasos completos a la
 * vez. Sin pago, checkout, envío ni persistencia.
 */
export default function AdoptionRitual() {
  const [paso, setPaso] = useState<PasoRitual>('cultivo');
  const [arbolId, setArbolId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [nivelId, setNivelId] = useState<string | null>(null);

  const pasoActual = RITUAL_STEPS.find((s) => s.num === pasoNumero(paso));

  function pasoNumero(p: PasoRitual): string {
    return p === 'cultivo' ? '01' : p === 'nombre' ? '02' : p === 'nivel' ? '03' : '04';
  }

  const reiniciar = () => {
    setPaso('cultivo');
    setArbolId(null);
    setNombre('');
    setNivelId(null);
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
          <TuesteTreeEyebrow>PASO 03 · COFUNDACIÓN</TuesteTreeEyebrow>
          <h3 id="ritual-paso-03" className={styles.sectionTitle}>
            {RITUAL_LEVEL_LABEL}
          </h3>
          <p className={styles.ritualHint}>{RITUAL_LEVEL_HINT}</p>
          <CofoundingLevels
            nivelId={nivelId}
            onSelect={(id) => {
              if (id) {
                setNivelId(id);
                setPaso('certificado');
              }
            }}
          />
          <button type="button" className={styles.ctaGhost} onClick={reiniciar}>
            Volver al inicio
          </button>
        </section>
      )}

      {paso === 'certificado' && arbolId && nivelId && (
        <CertificadoBitacora
          arbolId={arbolId}
          nombre={nombre}
          nivelId={nivelId}
          onRestart={reiniciar}
        />
      )}
    </div>
  );
}
