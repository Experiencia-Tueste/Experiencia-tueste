import type { PublicEditorialProjection } from '@/features/public-content/types';
import styles from './PublishedEditorial.module.css';

function publicationDate(value: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota',
  }).format(new Date(value));
}

export default function PublishedEditorial({
  projection,
}: {
  projection: PublicEditorialProjection;
}) {
  if (projection.entries.length === 0 && projection.releases.length === 0) return null;

  return (
    <section id="novedades" className={styles.section} aria-labelledby="novedades-titulo">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>TUESTE · PUBLICADO DESDE EL PANEL</p>
        <h2 id="novedades-titulo" className={styles.title}>
          Lo nuevo del origen
        </h2>
        <p className={styles.lead}>
          Historias y lanzamientos aprobados por el equipo editorial. Esta selección cambia sin
          necesidad de un nuevo despliegue.
        </p>

        <div className={styles.grid}>
          {projection.releases.map((release) => (
            <article className={styles.card} key={release.id}>
              {release.coverUrl ? (
                // URL firmada y temporal de un bucket privado; se sirve directamente.
                // eslint-disable-next-line @next/next/no-img-element -- dominio dinámico de Storage
                <img className={styles.cover} src={release.coverUrl} alt={release.coverAlt} />
              ) : null}
              <div className={styles.body}>
                <span className={styles.meta}>
                  Lanzamiento · {publicationDate(release.publishedAt)}
                </span>
                <h3 className={styles.cardTitle}>{release.title}</h3>
                {release.tracks.length > 0 ? (
                  <ol className={styles.tracks} aria-label={`Pistas de ${release.title}`}>
                    {release.tracks.map((track) => (
                      <li className={styles.track} key={track.id}>
                        <span>
                          {track.title}
                          {track.hz ? ` · ${track.hz} Hz` : ''}
                        </span>
                        {track.audioUrl ? (
                          <audio controls preload="none" src={track.audioUrl}>
                            Tu navegador no puede reproducir este audio.
                          </audio>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            </article>
          ))}

          {projection.entries.map((entry) => (
            <article className={styles.card} key={entry.id}>
              <div className={styles.body}>
                <span className={styles.meta}>Bitácora · {publicationDate(entry.publishedAt)}</span>
                <h3 className={styles.cardTitle}>{entry.title}</h3>
                {entry.body ? <p className={styles.copy}>{entry.body}</p> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
