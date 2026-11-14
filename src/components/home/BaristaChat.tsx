'use client';

import { useEffect, useRef, useState } from 'react';
import Sun from '../brand/Sun';
import { CHAT_FLOW, interpretFreeText, recommend } from '@/features/barista';
import type { BaristaAnswers, Recommendation } from '@/features/barista';
import type { TrackId } from '@/lib/audio';
import RecommendationCard from './RecommendationCard';
import styles from './BaristaChat.module.css';

interface Burbuja {
  quien: 'bot' | 'user';
  texto: string;
}

export interface BaristaChatProps {
  /** Reproduce la pista recomendada en el reproductor global. */
  onPlay: (id: TrackId) => void;
  /** Reproduce la cola de playlist recomendada en el reproductor global. */
  onPlayQueue: (ids: TrackId[]) => void;
}

/**
 * Chat del Barista Sonoro. Mantiene solo el estado local de la
 * conversación: burbujas, progreso, respuestas, carta y anuncios
 * aria-live. El flujo es determinista (CHAT_FLOW) y la recomendación se
 * delega en `recommend()`. El texto libre usa el intérprete determinista
 * antes de ejecutar la recomendación.
 * `mensajeBot` es un anunciante aria-live dedicado que anuncia solo el
 * último mensaje nuevo del bot (preguntas siguientes, confirmación e
 * interpretación), sin repetir la carta ni los mensajes del usuario.
 */
export default function BaristaChat({ onPlay, onPlayQueue }: BaristaChatProps) {
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
    const libre = texto.trim();
    if (!libre) return;
    const interpretacion = interpretFreeText(libre);
    const r = recommend(interpretacion.answers);
    setRespuestas(interpretacion.answers);
    setTexto('');
    setPaso(CHAT_FLOW.length);
    setRecomendacion(r);
    setBurbujas((b) => [
      ...b,
      { quien: 'user', texto: libre },
      { quien: 'bot', texto: interpretacion.summary },
      { quien: 'bot', texto: 'Listo. Esta es tu preparación recomendada para hoy.' },
    ]);
    setMensajeBot(interpretacion.summary);
  };

  const manejarPlaylist = () => {
    if (!recomendacion) return;
    onPlayQueue(recomendacion.playlist);
    setAnuncio(`Playlist iniciada: ${recomendacion.playlist.length} piezas en cola.`);
  };

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
            key={recomendacion.method.id}
            recommendation={recomendacion}
            onPlay={onPlay}
            onPlayQueue={manejarPlaylist}
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
