'use client';

import { useEffect, useState } from 'react';
import styles from './ThemeToggle.module.css';

const DAY_KEY = 'tueste-mode';

function readInitialMode(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = window.localStorage.getItem(DAY_KEY);
  if (stored === 'day') return true;
  if (stored === 'night') return false;
  return false;
}

/**
 * Toggle día/noche real sobre la clase `body.day` definida en tokens.css.
 * Botón accesible: etiqueta textual para lectores de pantalla, estado
 * `aria-pressed` y persistencia en localStorage.
 */
export default function ThemeToggle() {
  const [isDay, setIsDay] = useState(false);

  useEffect(() => {
    // Lectura inicial de localStorage solo en cliente: evita hydration
    // mismatch (window no existe en SSR). Intencional, no es un efecto
    // de sincronización de estado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDay(readInitialMode());
  }, []);

  useEffect(() => {
    document.body.classList.toggle('day', isDay);
    window.localStorage.setItem(DAY_KEY, isDay ? 'day' : 'night');
  }, [isDay]);

  const label = isDay ? 'Cambiar a modo noche' : 'Cambiar a modo día';

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={() => setIsDay((d) => !d)}
      aria-pressed={isDay}
      aria-label={label}
      title={label}
    >
      <svg className={styles.sun} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19" />
      </svg>
      <svg className={styles.moon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M20.4 14.2A8.5 8.5 0 0 1 9.8 3.6a8.5 8.5 0 1 0 10.6 10.6z" />
      </svg>
    </button>
  );
}
