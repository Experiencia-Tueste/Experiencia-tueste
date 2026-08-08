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
 * IntersectionObserver con threshold 0.12). El layout envía `html.js`
 * directamente desde SSR (sin script inline, sin hydration mismatch); con
 * JS activo el bloque se oculta vía CSS (`html.js .reveal:not(.in)`) y el
 * observer añade `.in` al entrar en viewport. Sin JavaScript, un
 * `<noscript>` en el layout fuerza `[data-reveal]` a opacity 1
 * y sin transformación, así el contenido nunca queda oculto. Al revelarse
 * el observador se desconecta.
 *
 * La clase `.in` se aplica directamente al DOM (sin estado React) para
 * evitar re-renders. Accesibilidad: `prefers-reduced-motion` deja todo
 * visible sin transición, y `:focus-within` muestra cualquier bloque aún
 * oculto si el usuario tabula hacia su interior. El wrapper no añade texto
 * ni roles: solo envuelve el contenido real.
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
