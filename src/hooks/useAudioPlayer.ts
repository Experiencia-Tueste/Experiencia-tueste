'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getChannel, getTrack, nextInQueue, radioDemoTrackId, TRACKS } from '@/features/audio';
import type { RadioChannelId, RadioDemoOption } from '@/features/audio';
import type { TrackId } from '@/lib/audio';

export interface AudioPlayerResult {
  /** Pista seleccionada/reproduciéndose (compartida con Origen, Música…). */
  trackId: TrackId;
  playing: boolean;
  loading: boolean;
  error: string | null;
  currentTime: number;
  duration: number;
  /** Señal de radio encadenada activa (null = escucha libre). */
  channelId: RadioChannelId | null;
  /** AnalyserNode del grafo de audio (null si el navegador no lo permite). */
  analyser: AnalyserNode | null;
  /** Mensaje accesible para el área aria-live del reproductor. */
  mensaje: string | null;
  /**
   * True tras la primera interacción del usuario (reproducir, seleccionar
   * pista o elegir canal): el deck muestra entonces el modo de la pista
   * en vez de «— Hz · esperando señal».
   */
  hasInteracted: boolean;
  togglePlay: () => void;
  /** Selección manual (TrackList, Origen, Barista, Lanzamientos): desactiva el canal. */
  select: (id: TrackId) => void;
  seek: (t: number) => void;
  /** Elige una señal de Radio Demo (o «Escucha libre»). */
  selectChannel: (option: RadioDemoOption) => void;
}

/**
 * Ciclo de vida del navegador del reproductor: un único HTMLAudioElement
 * (preload="metadata"), AudioContext + MediaElementAudioSourceNode +
 * AnalyserNode creados solo tras la primera interacción del usuario
 * (autoplay policy), estados de reproducción/progreso/error y la radio
 * encadenada (ended → nextInQueue). SSR seguro: nada de esto corre en el
 * servidor (todo vive en effects y callbacks de eventos).
 *
 * El grafo de audio se crea una sola vez: source → analyser → destination,
 * con fftSize 256 y smoothingTimeConstant 0.82. Toda acción que arranca
 * reproducción real (togglePlay, selección de señal Radio, siguiente pista
 * en `ended`) asegura primero el grafo y reanuda el contexto si quedó
 * suspended. Si el navegador no ofrece AudioContext, la reproducción MP3
 * sigue funcionando sin visualizador reactivo (analyser null).
 */
export function useAudioPlayer(): AudioPlayerResult {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const trackIdRef = useRef<TrackId>(TRACKS[0]?.id ?? '');
  const playingRef = useRef(false);
  const channelRef = useRef<RadioChannelId | null>(null);

  const [trackId, setTrackId] = useState<TrackId>(TRACKS[0]?.id ?? '');
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [channelId, setChannelId] = useState<RadioChannelId | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  /**
   * Crea el grafo de audio (una sola vez, tras interacción del usuario)
   * y lo reanuda si quedó suspended. Nunca se ejecuta en SSR: solo se
   * invoca desde acciones del usuario o arranques de reproducción.
   */
  const ensureAudioGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || typeof window === 'undefined') return;
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      try {
        const ctx = new Ctor();
        const source = ctx.createMediaElementSource(audio);
        const node = ctx.createAnalyser();
        node.fftSize = 256;
        node.smoothingTimeConstant = 0.82;
        source.connect(node);
        node.connect(ctx.destination);
        ctxRef.current = ctx;
        sourceRef.current = source;
        analyserRef.current = node;
        setAnalyser(node);
      } catch {
        // Sin grafo de audio: la reproducción MP3 sigue funcionando.
        return;
      }
    }
    if (ctxRef.current.state === 'suspended') {
      void ctxRef.current.resume().catch(() => {
        // El contexto puede negarse a reanudar; el MP3 suena igual.
      });
    }
  }, []);

  /** Reproduce una pista desde cero (grafo asegurado + src + play). */
  const playTrack = useCallback(
    (id: TrackId) => {
      const track = getTrack(id);
      const audio = audioRef.current;
      if (!track || !audio) return;
      ensureAudioGraph();
      trackIdRef.current = id;
      setTrackId(id);
      setError(null);
      setCurrentTime(0);
      audio.src = track.src;
      playingRef.current = true;
      setPlaying(true);
      audio.play().catch(() => {
        playingRef.current = false;
        setPlaying(false);
        setError('El navegador bloqueó la reproducción.');
      });
    },
    [ensureAudioGraph],
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setHasInteracted(true);
    if (!playingRef.current) {
      ensureAudioGraph();
      if (!audio.src) {
        playTrack(trackIdRef.current);
      } else {
        playingRef.current = true;
        setPlaying(true);
        audio.play().catch(() => {
          playingRef.current = false;
          setPlaying(false);
          setError('El navegador bloqueó la reproducción.');
        });
      }
    } else {
      playingRef.current = false;
      setPlaying(false);
      audio.pause();
    }
  }, [ensureAudioGraph, playTrack]);

  /** Selección manual: desactiva el canal encadenado. */
  const select = useCallback(
    (id: TrackId) => {
      const track = getTrack(id);
      const audio = audioRef.current;
      if (!track || !audio) return;
      setHasInteracted(true);
      channelRef.current = null;
      setChannelId(null);
      trackIdRef.current = id;
      setTrackId(id);
      setError(null);
      setCurrentTime(0);
      audio.src = track.src;
      if (playingRef.current) {
        ensureAudioGraph();
        playingRef.current = true;
        setPlaying(true);
        audio.play().catch(() => {
          playingRef.current = false;
          setPlaying(false);
          setError('El navegador bloqueó la reproducción.');
        });
      } else {
        setMensaje(`Seleccionada: ${track.title}`);
      }
    },
    [ensureAudioGraph],
  );

  const seek = useCallback((t: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const d = audio.duration;
    if (!Number.isFinite(d) || d <= 0) return;
    const clamped = Math.min(Math.max(t, 0), d);
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }, []);

  const selectChannel = useCallback(
    (option: RadioDemoOption) => {
      const audio = audioRef.current;
      if (!audio) return;
      setHasInteracted(true);
      if (option.channel === null) {
        // «Escucha libre»: sin canal; solo selecciona la pista inicial.
        channelRef.current = null;
        setChannelId(null);
        const id = radioDemoTrackId(option);
        const track = getTrack(id);
        if (!track) return;
        trackIdRef.current = id;
        setTrackId(id);
        setError(null);
        setCurrentTime(0);
        audio.src = track.src;
        if (playingRef.current) {
          // Si estaba sonando, la pista inicial sigue sonando (sin encadenar).
          ensureAudioGraph();
          playingRef.current = true;
          setPlaying(true);
          audio.play().catch(() => {
            playingRef.current = false;
            setPlaying(false);
            setError('El navegador bloqueó la reproducción.');
          });
        } else {
          setMensaje(`Señal «${option.label}» seleccionada en el reproductor.`);
        }
        return;
      }
      channelRef.current = option.channel;
      setChannelId(option.channel);
      playTrack(radioDemoTrackId(option));
      setMensaje(`Señal «${option.label}» activa en continuo.`);
    },
    [ensureAudioGraph, playTrack],
  );

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onPlay = () => {
      playingRef.current = true;
      setPlaying(true);
    };
    const onPause = () => {
      playingRef.current = false;
      setPlaying(false);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    const onError = () => {
      setLoading(false);
      setError('No se pudo cargar el audio.');
    };
    const onEnded = () => {
      const canal = channelRef.current;
      if (canal) {
        const ch = getChannel(canal);
        const next = ch ? nextInQueue(ch, trackIdRef.current) : undefined;
        if (next) {
          playTrack(next.id);
          return;
        }
      }
      setMensaje('Preview terminado.');
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);
    audio.addEventListener('ended', onEnded);

    return () => {
      // Limpieza completa al desmontar: sin actualizaciones de estado.
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('ended', onEnded);
      audio.src = '';
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        void ctxRef.current.close().catch(() => {
          // El cierre del contexto puede fallar si ya está cerrado.
        });
      }
      audioRef.current = null;
      sourceRef.current = null;
      analyserRef.current = null;
      ctxRef.current = null;
    };
  }, [playTrack]);

  return {
    trackId,
    playing,
    loading,
    error,
    currentTime,
    duration,
    channelId,
    analyser,
    mensaje,
    hasInteracted,
    togglePlay,
    select,
    seek,
    selectChannel,
  };
}
