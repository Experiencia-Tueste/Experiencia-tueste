import Image from 'next/image';
import type { Release, ReleaseSeason } from '@/features/music';
import type { TrackId } from '@/lib/audio';
import styles from './ReleaseCard.module.css';

/**
 * Gradientes de portada por temporada (deterministas, del mockup).
 * Se usan como FALLBACK editorial mientras no exista el asset local:
 * en cuanto `release.coverImage` apunte a `public/images/releases/…`,
 * la tarjeta muestra esa fotografía/portada real.
 */
const SEASON_GRADIENT: Record<ReleaseSeason, readonly [string, string]> = {
  floracion: ['#6667A8', '#FF6F86'],
  cosecha: ['#FBA922', '#FF6F86'],
  germinacion: ['#0FA295', '#2E093C'],
  tostion: ['#2E093C', '#FBA922'],
};

/**
 * Barras de frecuencia de la portada · 24 coordenadas precalculadas
 * (una cada 15°, radio interior 70, exterior variable) fijadas como
 * literal `as const`. Render determinista: sin trigonometría ni
 * aleatoriedad en el módulo ni en el render.
 */
const BARRAS = [
  [270, 200, 296, 200],
  [267.6, 218.1, 300.5, 226.9],
  [260.6, 235, 297, 256],
  [249.5, 249.5, 284.9, 284.9],
  [235, 260.6, 264, 310.9],
  [218.1, 267.6, 224.8, 292.7],
  [200, 270, 200, 304],
  [181.9, 267.6, 171, 308.2],
  [165, 260.6, 140, 303.9],
  [150.5, 249.5, 109.5, 290.5],
  [139.4, 235, 116.9, 248],
  [132.4, 218.1, 99.5, 226.9],
  [130, 200, 88, 200],
  [132.4, 181.9, 84.1, 168.9],
  [139.4, 165, 89.1, 136],
  [150.5, 150.5, 132.1, 132.1],
  [165, 139.4, 148, 109.9],
  [181.9, 132.4, 171, 91.8],
  [200, 130, 200, 80],
  [218.1, 132.4, 233.1, 76.4],
  [235, 139.4, 248, 116.9],
  [249.5, 150.5, 273.5, 126.5],
  [260.6, 165, 297, 144],
  [267.6, 181.9, 315.9, 168.9],
] as const;

export interface ReleaseCardProps {
  release: Release;
  /** Selecciona la pista asociada en el reproductor. */
  onSelect: (id: TrackId) => void;
}

/**
 * Tarjeta de lanzamiento.
 *
 * Portada: asset local (`coverImage`) cuando existe; mientras los
 * assets estén pendientes, usa el fallback editorial SVG (gradiente por
 * temporada + barras de frecuencia precalculadas).
 *
 * Compra: con `purchaseStatus: 'unavailable'` muestra un botón honesto
 * y deshabilitado «Compra próximamente» (sin enlaces vacíos, sin
 * checkout ficticio ni Mercado Pago simulado). Cuando exista
 * `purchaseUrl`, el mismo componente muestra «Comprar» y abre
 * únicamente esa URL.
 *
 * Spotify: si `spotifyUrl` existe, se abre en pestaña nueva con
 * `rel="noreferrer"`.
 */
export default function ReleaseCard({ release, onSelect }: ReleaseCardProps) {
  const [c1, c2] = SEASON_GRADIENT[release.season];
  const gradId = `rel-grad-${release.id}`;

  const handleListen = () => onSelect(release.trackId);
  const puedeComprar = release.purchaseStatus === 'available' && release.purchaseUrl;

  return (
    <article className={styles.card}>
      <div className={styles.cover}>
        {release.coverImage ? (
          <Image
            src={release.coverImage}
            alt={`Portada de ${release.title}`}
            fill
            sizes="(max-width: 780px) 100vw, 25vw"
            className={styles.artImage}
          />
        ) : (
          <svg
            className={styles.art}
            viewBox="0 0 400 400"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <radialGradient id={gradId} cx="38%" cy="34%" r="85%">
                <stop offset="0" stopColor={c1} />
                <stop offset="1" stopColor={c2} />
              </radialGradient>
            </defs>
            <rect width="400" height="400" fill={`url(#${gradId})`} />
            {BARRAS.map(([x1, y1, x2, y2], i) => (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#FFE8BF"
                strokeWidth="2"
                opacity="0.32"
              />
            ))}
            <circle cx="200" cy="200" r="56" fill="#0d0210" opacity="0.5" />
            <circle
              cx="200"
              cy="200"
              r="56"
              fill="none"
              stroke="#FFE8BF"
              strokeWidth="1.4"
              opacity="0.5"
            />
            <circle cx="200" cy="200" r="9" fill="#FFE8BF" opacity="0.85" />
          </svg>
        )}

        <span className={styles.kind}>{release.kind}</span>

        <a
          className={styles.play}
          href="#frecuencias"
          onClick={handleListen}
          aria-label={`Escuchar ${release.title}`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M8 5v14l11-7z" />
          </svg>
        </a>

        <div className={styles.ov}>
          <h3>{release.title}</h3>
        </div>
      </div>

      <div className={styles.body}>
        <span className={styles.meta}>{release.date} · Logik Pro</span>
        <span className={styles.formats}>{release.formats}</span>

        {release.spotifyUrl ? (
          <a
            className={styles.spotify}
            href={release.spotifyUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.6 14.4a.62.62 0 01-.86.21c-2.35-1.44-5.3-1.76-8.79-.96a.62.62 0 11-.28-1.21c3.81-.87 7.08-.5 9.72 1.11.3.18.39.57.21.85zm1.23-2.74a.78.78 0 01-1.07.26c-2.69-1.65-6.79-2.13-9.97-1.17a.78.78 0 11-.45-1.49c3.64-1.1 8.16-.56 11.24 1.33.37.22.49.71.25 1.07zm.11-2.85C14.83 8.94 9.4 8.76 6.3 9.7a.93.93 0 11-.54-1.79c3.56-1.08 9.56-.87 13.34 1.37a.94.94 0 01-.96 1.61z" />
            </svg>
            Escuchar en Spotify
          </a>
        ) : null}

        <div className={styles.foot}>
          <a className={styles.listen} href="#frecuencias" onClick={handleListen}>
            <span aria-hidden="true">▶</span> Escuchar
          </a>
          {puedeComprar ? (
            <a
              className={styles.buy}
              href={release.purchaseUrl}
              target="_blank"
              rel="noreferrer noopener"
              data-commercial-intent={`release-${release.id}`}
            >
              Comprar
            </a>
          ) : (
            <button
              type="button"
              className={`${styles.buy} ${styles.soon}`}
              disabled
              data-commercial-intent={`release-${release.id}`}
            >
              Compra próximamente
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
