'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import styles from './Reveal.module.css';

export interface RevealProps {
  children: ReactNode;
  /** Clase adicional opcional (sin estilos de layout: solo decoración). */
  className?: string;
}

/**
 * Animación de entrada por scroll (paridad con el master: `.reveal` +
 * IntersectionObserver con threshold 0.12). El bloque nace visible y solo
 * se oculta cuando el documento tiene JS (`html.js`, añadido por un
 * script inline en el layout antes del primer paint): sin JavaScript el
 * contenido nunca queda oculto. Al entrar en viewport se añade la clase
 * `in` (opacity 1, sin transformación) y el observador se desconecta.
 *
 * La clase se aplica directamente al DOM (sin estado React) para evitar
 * re-renders y respetar la regla de lint de efectos. Accesibilidad:
 * `prefers-reduced-motion` deja todo visible sin transición, y
 * `:focus-within` muestra cualquier bloque aún oculto si el usuario
 * tabula hacia su interior. El wrapper no añade texto ni roles: solo
 * envuelve el contenido real.
 */
export default function Reveal({ children, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add(styles.in);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add(styles.in);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} data-reveal className={`${styles.reveal}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}
