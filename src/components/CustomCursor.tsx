'use client';

import { useEffect, useRef } from 'react';
import styles from './CustomCursor.module.css';

/**
 * Cursor personalizado de Tueste — paridad con el mockup del Master.
 *
 * En desktop con mouse real (hover: hover + pointer: fine) oculta el
 * cursor nativo y dibuja un punto flotante de 14 px crema que crece a
 * 36 px ámbar sobre elementos interactivos. En táctil (pointer:
 * coarse) o sin hover no se activa: se conserva el cursor nativo.
 *
 * El punto inicia oculto (opacity: 0) y se descubre con su posición
 * real en el primer pointermove, evitando el destello en (0, 0). La
 * detección de interactivos usa delegación con pointerover +
 * event.target.closest, sin depender de :hover.
 *
 * SSR seguro: el dot se renderiza pero no altera el DOM hasta que
 * useEffect confirma el dispositivo. Sin hydration mismatch.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;

    const hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!hasHover) {
      dot.style.display = 'none';
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;

    // Ocultar cursor nativo (solo en cliente, tras montaje).
    root.classList.add('cursor-none');

    let raf = 0;
    let mx = 0;
    let my = 0;
    let cx = 0;
    let cy = 0;
    let visible = false;

    const onPointerMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        // Primer movimiento: salta directamente a la posición real y
        // se hace visible, sin interpolar desde (0, 0).
        cx = mx;
        cy = my;
        dot.style.left = cx + 'px';
        dot.style.top = cy + 'px';
        dot.classList.add(styles.visible);
        visible = true;
      }
    };

    const onPointerOver = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const interactive = target.closest(
        'a, button, input, select, textarea, [role="button"], .track, .chip, .card, [data-interactive]',
      );
      dot.classList.toggle(styles.big, !!interactive);
    };

    const tick = () => {
      // Suavidad ligera (~0.3 lerp) o seguimiento inmediato si
      // reduced-motion.
      const speed = prefersReducedMotion ? 1 : 0.3;
      cx += (mx - cx) * speed;
      cy += (my - cy) * speed;
      dot.style.left = cx + 'px';
      dot.style.top = cy + 'px';
      raf = requestAnimationFrame(tick);
    };

    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerover', onPointerOver, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerover', onPointerOver);
      cancelAnimationFrame(raf);
      root.classList.remove('cursor-none');
    };
  }, []);

  return <div ref={dotRef} className={styles.dot} aria-hidden="true" />;
}
