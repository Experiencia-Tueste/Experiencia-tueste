import { useEffect, useRef, useState } from 'react';
import { getTrack } from '@/features/audio';
import { adjustRecipe, brewTotalSeconds, RECIPE_ADJUSTMENTS } from '@/features/barista';
import type { RecipeAdjustmentId, Recommendation } from '@/features/barista';
import type { TrackId } from '@/lib/audio';
import styles from './RecommendationCard.module.css';

const PERFIL_LABELS: ReadonlyArray<readonly [key: string, label: string]> = [
  ['acidez', 'Acidez'],
  ['dulzor', 'Dulzor'],
  ['cuerpo', 'Cuerpo'],
  ['aroma', 'Aroma'],
  ['amargor', 'Amargor'],
];

export interface RecommendationCardProps {
  recommendation: Recommendation;
  /** Reproduce la pista recomendada en el reproductor global. */
  onPlay: (id: TrackId) => void;
  /** Reproduce la cola recomendada en el reproductor global. */
  onPlayQueue: (ids: TrackId[]) => void;
}

/**
 * Carta del barista: método recomendado, receta, frecuencia y TrackId
 * asociado, perfil sensorial, mensaje del día, alternativa y pasos de
 * preparación expandibles. «Tomar la frecuencia» es un
 * enlace semántico a #frecuencias que reproduce la pista recomendada.
 */
export default function RecommendationCard({
  recommendation,
  onPlay,
  onPlayQueue,
}: RecommendationCardProps) {
  const { method, alternative } = recommendation;
  const [pasosAbiertos, setPasosAbiertos] = useState(false);
  const [methodView, setMethodView] = useState(method);
  const [ajuste, setAjuste] = useState<string | null>(null);
  const [timerStatus, setTimerStatus] = useState<'idle' | 'running' | 'paused' | 'done'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const elapsedBaseRef = useRef(0);

  const track = getTrack(methodView.trackId);
  const folio = String(1000 + methodView.freq);
  const totalSeconds = brewTotalSeconds(methodView);

  useEffect(() => {
    if (timerStatus !== 'running' || startedAtRef.current === null) return;
    const update = () => {
      const next = Math.min(
        totalSeconds,
        elapsedBaseRef.current + (Date.now() - startedAtRef.current!) / 1000,
      );
      setElapsed(next);
      if (next >= totalSeconds) {
        startedAtRef.current = null;
        elapsedBaseRef.current = totalSeconds;
        setTimerStatus('done');
      }
    };
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [timerStatus, totalSeconds]);

  const setElapsedAt = (next: number) => {
    const clamped = Math.min(Math.max(next, 0), totalSeconds);
    elapsedBaseRef.current = clamped;
    setElapsed(clamped);
    if (timerStatus === 'running') startedAtRef.current = Date.now();
    if (clamped < totalSeconds && timerStatus === 'done') setTimerStatus('paused');
  };

  const currentStepIndex = methodView.steps.reduce((index, step, i) => {
    const start = methodView.steps.slice(0, i).reduce((sum, item) => sum + (item.seconds ?? 0), 0);
    return elapsed >= start ? i : index;
  }, 0);

  const startTimer = () => {
    if (timerStatus === 'done') setElapsedAt(0);
    startedAtRef.current = Date.now();
    setTimerStatus('running');
    setPasosAbiertos(true);
  };

  const pauseTimer = () => {
    if (startedAtRef.current !== null) {
      elapsedBaseRef.current = Math.min(
        totalSeconds,
        elapsedBaseRef.current + (Date.now() - startedAtRef.current) / 1000,
      );
      setElapsed(elapsedBaseRef.current);
    }
    startedAtRef.current = null;
    setTimerStatus('paused');
  };

  const resetTimer = () => {
    startedAtRef.current = null;
    elapsedBaseRef.current = 0;
    setElapsed(0);
    setTimerStatus('idle');
  };

  const stepStart = (index: number) =>
    methodView.steps
      .slice(0, Math.max(0, index))
      .reduce((sum, step) => sum + (step.seconds ?? 0), 0);

  const adjust = (id: RecipeAdjustmentId) => {
    const result = adjustRecipe(method, id);
    setMethodView(result.method);
    setAjuste(`Ajuste aplicado: ${result.changes.join(' · ')}.`);
    resetTimer();
  };

  const restoreRecipe = () => {
    setMethodView(method);
    setAjuste('Receta original restaurada.');
    resetTimer();
  };

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <b>☕ Carta del barista · Origen Tostado</b>
        <span className={styles.folio}>Folio Nº {folio}</span>
      </div>

      <div className={styles.body}>
        <p className={styles.dx}>
          Hoy tu café es <b>{methodView.name}</b> · origen sugerido: {methodView.origen}.
        </p>

        <div className={styles.recipe}>
          <div>
            <span>Café</span>
            <b>{methodView.coffee}</b>
          </div>
          <div>
            <span>Agua</span>
            <b>{methodView.water}</b>
          </div>
          <div>
            <span>Temp.</span>
            <b>{methodView.temp}</b>
          </div>
          <div>
            <span>Molienda</span>
            <b>{methodView.grind}</b>
          </div>
          <div>
            <span>Tiempo</span>
            <b>{methodView.time}</b>
          </div>
          <div>
            <span>Ratio</span>
            <b>{methodView.ratio}</b>
          </div>
        </div>

        <div className={styles.line}>
          <span className={styles.sym} aria-hidden="true">
            ℞
          </span>
          <div className={styles.presc}>
            <b>
              {methodView.freq} Hz · {methodView.estado}
            </b>
            <span>Frecuencia ritual · suena «{track?.title ?? methodView.trackId}»</span>
          </div>
          <div className={styles.wave} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>

        <div className={styles.perfil}>
          {PERFIL_LABELS.map(([key, label]) => (
            <div className={styles.pf} key={key}>
              <span>{label}</span>
              <i
                style={{
                  width: `${methodView.perfil[key as keyof typeof methodView.perfil] * 20}%`,
                }}
              />
            </div>
          ))}
        </div>

        {alternative ? (
          <p className={styles.alt}>
            Para otro día: <b>{alternative.name}</b> · {alternative.freq} Hz · {alternative.estado}
          </p>
        ) : null}

        <dl className={styles.dl}>
          <dt>Por qué</dt>
          <dd>
            {recommendation.explanation.method} {recommendation.explanation.frequency} Las
            frecuencias acompañan la experiencia como guía ritual y emocional.
          </dd>
          <dt>✦ Mensaje del día</dt>
          <dd>{method.message}</dd>
        </dl>
      </div>

      <div className={styles.actions}>
        <a
          className={`${styles.btn} ${styles.play}`}
          href="#frecuencias"
          onClick={() => onPlay(methodView.trackId)}
        >
          <span aria-hidden="true">▶</span> Tomar la frecuencia
        </a>
        <button
          type="button"
          className={`${styles.btn} ${styles.brew}`}
          aria-expanded={pasosAbiertos}
          onClick={() => setPasosAbiertos((o) => !o)}
        >
          <span aria-hidden="true">⏱</span> Preparar guiado
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.save}`}
          onClick={() => onPlayQueue(recommendation.playlist)}
        >
          ♪ Reproducir playlist
        </button>
      </div>

      {pasosAbiertos || timerStatus !== 'idle' ? (
        <ol className={styles.steps}>
          <li className={styles.timer} role="timer" aria-label="Temporizador de preparación">
            <div className={styles.timerHead}>
              <b>Preparación guiada</b>
              <span>
                {Math.floor(elapsed / 60)}:{String(Math.floor(elapsed % 60)).padStart(2, '0')} /{' '}
                {Math.floor(totalSeconds / 60)}:{String(totalSeconds % 60).padStart(2, '0')}
              </span>
            </div>
            <strong>
              Paso {currentStepIndex + 1}: {methodView.steps[currentStepIndex]?.name}
            </strong>
            <div className={styles.timerActions}>
              {timerStatus === 'running' ? (
                <button type="button" onClick={pauseTimer}>
                  Pausar
                </button>
              ) : (
                <button type="button" onClick={startTimer}>
                  {timerStatus === 'paused'
                    ? 'Continuar'
                    : timerStatus === 'done'
                      ? 'Reiniciar'
                      : 'Iniciar'}
                </button>
              )}
              <button type="button" onClick={() => setElapsedAt(stepStart(currentStepIndex - 1))}>
                Retroceder
              </button>
              <button
                type="button"
                onClick={() =>
                  setElapsedAt(stepStart(Math.min(currentStepIndex + 1, methodView.steps.length)))
                }
              >
                Avanzar
              </button>
              <button type="button" onClick={resetTimer}>
                Reiniciar
              </button>
            </div>
          </li>
          {methodView.steps.map((s, i) => (
            <li key={i}>
              <b>{s.name}</b>
              <span>{s.description}</span>
              {s.seconds !== null ? <i>{s.seconds} s</i> : null}
            </li>
          ))}
        </ol>
      ) : null}

      <div className={styles.adjustments} aria-label="Ajustes de la receta">
        <span>Ajustar receta</span>
        {RECIPE_ADJUSTMENTS.map((option) => (
          <button type="button" key={option.id} onClick={() => adjust(option.id)}>
            {option.label}
          </button>
        ))}
        {methodView !== method ? (
          <button type="button" onClick={restoreRecipe}>
            Restaurar
          </button>
        ) : null}
        <p role="status" aria-live="polite">
          {ajuste ?? '\u00A0'}
        </p>
      </div>

      <p className={styles.foot}>
        Las frecuencias son una capa artística, ritual y emocional de la experiencia Tueste; no son
        una afirmación médica ni física sobre el cuerpo o el sabor del café. Tueste conecta café,
        música y ritual para recomendar una preparación que armoniza con tu intención del día.
      </p>
    </div>
  );
}
