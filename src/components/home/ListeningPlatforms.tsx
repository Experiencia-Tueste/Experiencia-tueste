import type { CSSProperties } from 'react';
import Reveal from './Reveal';
import styles from './ListeningPlatforms.module.css';

/**
 * Bloque «Llévatelo a donde escuches» (paridad con el master, dentro de
 * Lanzamientos). Cinco tarjetas editoriales de vidrio oscuro con icono,
 * nombre y subtítulo. Las cinco son enlaces reales a las plataformas
 * oficiales de Tueste / Origen Tostado: <a> semánticos que abren una
 * pestaña nueva (target=_blank, rel="noopener noreferrer"), sin SDKs,
 * embeds, window.open ni botones falsos.
 */
export interface Platform {
  id: string;
  nombre: string;
  subtitulo: string;
  /** Color de acento de la marca (CSS variable --accent). */
  accent: string;
  /** URL oficial; null = tarjeta no interactiva. */
  url: string | null;
}

export const PLATFORMS: readonly Platform[] = [
  {
    id: 'spotify',
    nombre: 'Spotify',
    subtitulo: 'SEGUIR · GUARDAR',
    accent: '#1DB954',
    url: 'https://open.spotify.com/artist/50lPI20KEXnXbYY2G8i787',
  },
  {
    id: 'apple-music',
    nombre: 'Apple Music',
    subtitulo: 'AÑADIR A BIBLIOTECA',
    accent: '#FA57C1',
    url: 'https://music.apple.com/co/artist/origen-tostado/1875514832',
  },
  {
    id: 'beatport',
    nombre: 'Beatport',
    subtitulo: 'EXTENDED MIXES',
    accent: '#19c9b8',
    url: 'https://www.beatport.com/es/label/logik-pro/26143',
  },
  {
    id: 'youtube',
    nombre: 'YouTube',
    subtitulo: 'VISUALIZERS · LIVES',
    accent: '#FF0000',
    url: 'https://youtube.com/channel/UCQ50GL0flNpt4SdWpnUFU8g?si=ZkhIxWQWY3mXVTLN',
  },
  {
    id: 'soundcloud',
    nombre: 'SoundCloud',
    subtitulo: 'SETS · DEMOS',
    accent: '#FBA922',
    url: 'https://soundcloud.com/tueste',
  },
];

/** Iconos SVG inline propios, simples y accesibles (aria-hidden). */
function PlatformIcon({ id }: { id: Platform['id'] }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {id === 'spotify' ? (
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.6 14.4a.62.62 0 01-.86.21c-2.35-1.44-5.3-1.76-8.79-.96a.62.62 0 11-.28-1.21c3.81-.87 7.08-.5 9.72 1.11.3.18.39.57.21.85zm1.23-2.74a.78.78 0 01-1.07.26c-2.69-1.65-6.79-2.13-9.97-1.17a.78.78 0 11-.45-1.49c3.64-1.1 8.16-.56 11.24 1.33.37.22.49.71.25 1.07zm.11-2.85C14.83 8.94 9.4 8.76 6.3 9.7a.93.93 0 11-.54-1.79c3.56-1.08 9.56-.87 13.34 1.37a.94.94 0 01-.96 1.61z" />
      ) : null}
      {id === 'apple-music' ? (
        <path d="M23.1 6.2c-.1-1.4-.4-2.3-.9-3.1a4.3 4.3 0 00-1.8-1.6C19.6 1 18.8.8 17.5.7 16.2.6 15.8.6 12.4.6S8.6.6 7.3.7C6 .8 5.2 1 4.5 1.5a4.3 4.3 0 00-1.8 1.6c-.5.8-.8 1.7-.9 3.1C1.7 7.5 1.7 7.9 1.7 12s0 4.5.1 5.8c.1 1.4.4 2.3.9 3.1.4.7 1 1.3 1.8 1.6.7.5 1.5.7 2.8.8 1.3.1 1.7.1 5.1.1s3.8 0 5.1-.1c1.3-.1 2.1-.3 2.8-.8a4.3 4.3 0 001.8-1.6c.5-.8.8-1.7.9-3.1.1-1.3.1-1.7.1-5.8s0-4.5-.1-5.8zM10 16.5v-9l6 4.5-6 4.5z" />
      ) : null}
      {id === 'beatport' ? <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 5l6 5-6 5V7z" /> : null}
      {id === 'youtube' ? (
        <path d="M23.5 6.5a3 3 0 00-2.1-2.1C19.6 4 12 4 12 4s-7.6 0-9.4.4A3 3 0 00.5 6.5C.1 8.3.1 12 .1 12s0 3.7.4 5.5a3 3 0 002.1 2.1C4.4 20 12 20 12 20s7.6 0 9.4-.4a3 3 0 002.1-2.1c.4-1.8.4-5.5.4-5.5s0-3.7-.4-5.5zM9.6 15.5v-7l6.3 3.5-6.3 3.5z" />
      ) : null}
      {id === 'soundcloud' ? (
        <path
          d="M2 14v3M5 11v6M8 9v8M11 7v10M14 5v12M17 9v6M20 12v3"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  );
}

export default function ListeningPlatforms() {
  return (
    <div id="plataformas" className={styles.block} aria-labelledby="plataformas-titulo">
      <Reveal>
        <h3 id="plataformas-titulo" className={styles.subhead}>
          Llévatelo a donde escuches
        </h3>
      </Reveal>
      <Reveal>
        <div className={styles.grid}>
          {PLATFORMS.map((p) => {
            const style = { '--accent': p.accent } as CSSProperties;
            const inner = (
              <>
                <PlatformIcon id={p.id} />
                <span className={styles.pt}>
                  <b>{p.nombre}</b>
                  <span>{p.subtitulo}</span>
                </span>
              </>
            );
            return p.url ? (
              <a
                key={p.id}
                className={styles.plat}
                style={style}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir perfil oficial de Origen Tostado en ${p.nombre}`}
                data-platform={p.id}
              >
                {inner}
              </a>
            ) : (
              <div key={p.id} className={styles.plat} style={style} data-platform={p.id}>
                {inner}
              </div>
            );
          })}
        </div>
      </Reveal>
    </div>
  );
}
