'use client';

import { useEffect, useRef, useState } from 'react';
import Sun from '../brand/Sun';
import { CHAT_FLOW, recommend } from '@/features/barista';
import type { BaristaAnswers, Recommendation } from '@/features/barista';
import type { TrackId } from '@/lib/audio';
import RecommendationCard from './RecommendationCard';
import styles from './BaristaChat.module.css';

const AVISO_IA =
  'Las consultas libres se habilitarán cuando se apruebe el proveedor de IA; por ahora elige una opción.';
const MENSAJE_PLAYLIST = 'Playlist disponible próximamente.';

interface Burbuja {
  quien: 'bot' | 'user';
  texto: string;
}

/** Ajustes posteriores a la carta (del mockup), con respuesta del bot. */
const AJUSTES: ReadonlyArray<readonly [label: string, respuesta: string]> = [
  ['Más dulce', 'Para más dulzor: baja 1–2 °C la temperatura y alarga ligeramente la extracción.'],
  ['Más fuerte', 'Para más fuerza: sube la dosis de café o reduce el agua.'],
  ['Menos ácido', 'Para menos acidez: muele un poco más grueso o baja la temperatura.'],
];

export interface BaristaChatProps {
  /** Selecciona la pista recomendada en el reproductor (estado compartido). */
  onSelect: (id: TrackId) => void;
}

/**
 * Chat del Barista Sonoro. Mantiene solo el estado local de la
 * conversación: burbujas, progreso, respuestas, carta y anuncios
 * aria-live. El flujo es determinista (CHAT_FLOW) y la recomendación se
 * delega en `recommend()` del feature barista. Sin temporizadores
 * ficticios ni APIs: el texto libre solo muestra un aviso accesible.
 * `mensajeBot` es un anunciante aria-live dedicado que anuncia solo el
 * último mensaje nuevo del bot (preguntas siguientes, confirmación y
 * ajustes), sin repetir la carta ni los mensajes del usuario.
 */
export default function BaristaChat({ onSelect }: BaristaChatProps) {
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<Partial<BaristaAnswers>>({});
  const [recomendacion, setRecomendacion] = useState<Recommendation | null>(null);
  const [burbujas, setBurbujas] = useState<Burbuja[]>([]);
  const [anuncio, setAnuncio] = useState<string | null>(null);
  const [mensajeBot, setMensajeBot] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);

  const pregunta = CHAT_FLOW[paso];

  // Mensaje inicial del bot al montar: semilla del chat en cliente.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBurbujas([{ quien: 'bot', texto: CHAT_FLOW[0].question }]);
  }, []);

  // Auto-scroll del cuerpo del chat al final.
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [burbujas, recomendacion]);

  const responder = (label: string, value: string) => {
    setAnuncio(null);
    const next = { ...respuestas, [pregunta.key]: value };
    setRespuestas(next);
    setBurbujas((b) => [...b, { quien: 'user', texto: label }]);

    const siguiente = paso + 1;
    if (siguiente < CHAT_FLOW.length) {
      setPaso(siguiente);
      setBurbujas((b) => [...b, { quien: 'bot', texto: CHAT_FLOW[siguiente].question }]);
      setMensajeBot(CHAT_FLOW[siguiente].question);
      return;
    }

    const r = recommend(next as BaristaAnswers);
    setPaso(CHAT_FLOW.length);
    setRecomendacion(r);
    setBurbujas((b) => [
      ...b,
      { quien: 'bot', texto: 'Listo. Esta es tu preparación recomendada para hoy.' },
    ]);
    setMensajeBot('Listo. Esta es tu preparación recomendada para hoy.');
  };

  const reiniciar = () => {
    setPaso(0);
    setRespuestas({});
    setRecomendacion(null);
    setAnuncio(null);
    setMensajeBot(null);
    setBurbujas([{ quien: 'bot', texto: CHAT_FLOW[0].question }]);
  };

  const enviarTexto = () => {
    if (!texto.trim()) return;
    setBurbujas((b) => [...b, { quien: 'user', texto: texto.trim() }]);
    setTexto('');
    setAnuncio(AVISO_IA);
  };

  const manejarPlaylist = () => setAnuncio(MENSAJE_PLAYLIST);

  return (
    <div className={styles.consulta}>
      <div className={styles.head}>
        <Sun size={42} />
        <div className={styles.info}>
          <b>Barista Sonoro · Origen Tostado</b>
          <span>café + frecuencia · en línea</span>
        </div>
      </div>

      <div className={styles.body} ref={bodyRef}>
        {burbujas.map((b, i) =>
          b.quien === 'bot' ? (
            <div className={`${styles.bub} ${styles.bot}`} key={i}>
              <span className={styles.avatar} aria-hidden="true">
                <Sun size={26} />
              </span>
              <span>{b.texto}</span>
            </div>
          ) : (
            <div className={`${styles.bub} ${styles.user}`} key={i}>
              {b.texto}
            </div>
          ),
        )}

        {recomendacion ? (
          <RecommendationCard
            recommendation={recomendacion}
            onSelect={onSelect}
            onPlaylist={manejarPlaylist}
          />
        ) : null}
      </div>

      <div className={styles.prog} aria-hidden="true">
        {CHAT_FLOW.map((_, i) => (
          <i key={i} className={i < paso ? styles.done : i === paso ? styles.cur : undefined} />
        ))}
      </div>

      <div className={styles.chips} role="group" aria-label="Opciones de respuesta">
        {recomendacion ? (
          <>
            {AJUSTES.map(([label, respuesta]) => (
              <button
                type="button"
                key={label}
                className={styles.chip}
                onClick={() => {
                  setBurbujas((b) => [
                    ...b,
                    { quien: 'user', texto: label },
                    { quien: 'bot', texto: respuesta },
                  ]);
                  setMensajeBot(respuesta);
                }}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              className={`${styles.chip} ${styles.restart}`}
              onClick={reiniciar}
            >
              ↻ Otra consulta
            </button>
          </>
        ) : pregunta ? (
          pregunta.options.map(([label, value]) => (
            <button
              type="button"
              key={value}
              className={styles.chip}
              onClick={() => responder(label, value)}
            >
              {label}
            </button>
          ))
        ) : null}
      </div>

      <div className={styles.input}>
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') enviarTexto();
          }}
          placeholder="…o escríbelo con tus palabras: «algo dulce y rápido para trabajar»"
          aria-label="Escríbele al barista"
          maxLength={140}
        />
        <button type="button" onClick={enviarTexto} aria-label="Enviar">
          ➔
        </button>
      </div>

      <p className={styles.live} role="status" aria-live="polite">
        {anuncio ?? '\u00A0'}
      </p>
      <p className={styles.liveBot} role="status" aria-live="polite">
        {mensajeBot ?? ''}
      </p>
    </div>
  );
}
