import { useState } from 'react';
import { getTrack } from '@/features/audio';
import type { Recommendation } from '@/features/barista';
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
  /** Selecciona la pista recomendada en el reproductor (estado compartido). */
  onSelect: (id: TrackId) => void;
  /** Anuncia «Playlist disponible próximamente.» (aria-live del chat). */
  onPlaylist: () => void;
}

/**
 * Carta del barista: método recomendado, receta, frecuencia y TrackId
 * asociado, perfil sensorial, mensaje del día, alternativa y pasos de
 * preparación expandibles (sin temporizador). «Tomar la frecuencia» es un
 * enlace semántico a #frecuencias que selecciona la pista recomendada.
 */
export default function RecommendationCard({
  recommendation,
  onSelect,
  onPlaylist,
}: RecommendationCardProps) {
  const { method, alternative } = recommendation;
  const [pasosAbiertos, setPasosAbiertos] = useState(false);

  const track = getTrack(method.trackId);
  const folio = String(1000 + method.freq);

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <b>☕ Carta del barista · Origen Tostado</b>
        <span className={styles.folio}>Folio Nº {folio}</span>
      </div>

      <div className={styles.body}>
        <p className={styles.dx}>
          Hoy tu café es <b>{method.name}</b> · origen sugerido: {method.origen}.
        </p>

        <div className={styles.recipe}>
          <div>
            <span>Café</span>
            <b>{method.coffee}</b>
          </div>
          <div>
            <span>Agua</span>
            <b>{method.water}</b>
          </div>
          <div>
            <span>Temp.</span>
            <b>{method.temp}</b>
          </div>
          <div>
            <span>Molienda</span>
            <b>{method.grind}</b>
          </div>
          <div>
            <span>Tiempo</span>
            <b>{method.time}</b>
          </div>
          <div>
            <span>Ratio</span>
            <b>{method.ratio}</b>
          </div>
        </div>

        <div className={styles.line}>
          <span className={styles.sym} aria-hidden="true">
            ℞
          </span>
          <div className={styles.presc}>
            <b>
              {method.freq} Hz · {method.estado}
            </b>
            <span>Frecuencia ritual · suena «{track?.title ?? method.trackId}»</span>
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
              <i style={{ width: `${method.perfil[key as keyof typeof method.perfil] * 20}%` }} />
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
            Esta preparación conecta con el estado de {method.estado}. La frecuencia {method.freq}{' '}
            Hz acompaña la experiencia como guía ritual y emocional.
          </dd>
          <dt>✦ Mensaje del día</dt>
          <dd>{method.message}</dd>
        </dl>
      </div>

      <div className={styles.actions}>
        <a
          className={`${styles.btn} ${styles.play}`}
          href="#frecuencias"
          onClick={() => onSelect(method.trackId)}
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
        <button type="button" className={`${styles.btn} ${styles.save}`} onClick={onPlaylist}>
          ♪ Playlist
        </button>
      </div>

      {pasosAbiertos ? (
        <ol className={styles.steps}>
          {method.steps.map((s, i) => (
            <li key={i}>
              <b>{s.name}</b>
              <span>{s.description}</span>
              {s.seconds !== null ? <i>{s.seconds} s</i> : null}
            </li>
          ))}
        </ol>
      ) : null}

      <p className={styles.foot}>
        Las frecuencias son una capa artística, ritual y emocional de la experiencia Tueste; no son
        una afirmación médica ni física sobre el cuerpo o el sabor del café. Tueste conecta café,
        música y ritual para recomendar una preparación que armoniza con tu intención del día.
      </p>
    </div>
  );
}
