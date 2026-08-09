import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CustomCursor from '../CustomCursor';
import styles from '../CustomCursor.module.css';

beforeEach(() => {
  vi.useFakeTimers();
  // Desktop con mouse real por defecto.
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: query === '(hover: hover) and (pointer: fine)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.documentElement.classList.remove('cursor-none');
});

describe('CustomCursor (desktop con mouse)', () => {
  it('es decorativo, no interactivo e inicia oculto', () => {
    const { container } = render(<CustomCursor />);

    const dot = container.firstChild as HTMLElement;
    expect(dot).not.toBeNull();
    expect(dot.getAttribute('aria-hidden')).toBe('true');
    expect(dot.classList.contains(styles.dot)).toBe(true);
    // El punto nace oculto (opacity: 0 vía CSS). No debe tener la clase
    // visible hasta el primer pointermove.
    expect(dot.classList.contains(styles.visible)).toBe(false);
  });

  it('se hace visible tras el primer pointermove con posición real', () => {
    const { container } = render(<CustomCursor />);
    const dot = container.firstChild as HTMLElement;

    document.dispatchEvent(new MouseEvent('pointermove', { clientX: 200, clientY: 150 }));

    expect(dot.classList.contains(styles.visible)).toBe(true);
    // La posición debe ser exacta (sin lerp en el primer frame).
    expect(dot.style.left).toBe('200px');
    expect(dot.style.top).toBe('150px');
  });

  it('al montar oculta el cursor nativo (clase cursor-none)', () => {
    render(<CustomCursor />);

    expect(document.documentElement.classList.contains('cursor-none')).toBe(true);
  });

  it('al desmontar restaura el cursor nativo y limpia listeners', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = render(<CustomCursor />);

    expect(addSpy).toHaveBeenCalledWith('pointermove', expect.any(Function), expect.any(Object));
    expect(addSpy).toHaveBeenCalledWith('pointerover', expect.any(Function), expect.any(Object));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('pointerover', expect.any(Function));
    expect(document.documentElement.classList.contains('cursor-none')).toBe(false);
  });

  it('activa la clase big al hacer pointerover sobre un elemento interactivo', () => {
    const { container } = render(<CustomCursor />);
    const dot = container.firstChild as HTMLElement;

    // Elemento real en el DOM; el evento se despacha desde el botón y
    // sube por bubbling hasta el listener delegado en document.
    const button = document.createElement('button');
    document.body.appendChild(button);

    button.dispatchEvent(new MouseEvent('pointerover', { bubbles: true }));

    expect(dot.classList.contains(styles.big)).toBe(true);

    document.body.removeChild(button);
  });

  it('quita la clase big al hacer pointerover sobre un no-interactivo', () => {
    const { container } = render(<CustomCursor />);
    const dot = container.firstChild as HTMLElement;

    // Forzamos big antes.
    dot.classList.add(styles.big);

    const p = document.createElement('p');
    document.body.appendChild(p);

    p.dispatchEvent(new MouseEvent('pointerover', { bubbles: true }));

    expect(dot.classList.contains(styles.big)).toBe(false);

    document.body.removeChild(p);
  });
});

describe('CustomCursor (táctil / puntero coarse)', () => {
  it('no se activa ni oculta el cursor nativo en puntero coarse', () => {
    vi.restoreAllMocks();
    vi.spyOn(window, 'matchMedia').mockImplementation(
      () =>
        ({
          matches: false,
          media: '',
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    );

    const { container } = render(<CustomCursor />);
    const dot = container.firstChild as HTMLElement;

    expect(dot.style.display).toBe('none');
    expect(document.documentElement.classList.contains('cursor-none')).toBe(false);
  });
});

describe('CustomCursor (reduced-motion)', () => {
  it('sigue activo pero sin transición suavizada con reduced-motion', () => {
    vi.restoreAllMocks();
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches:
            query === '(hover: hover) and (pointer: fine)' ||
            query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    );

    render(<CustomCursor />);

    // El cursor se activa (hay hover), pero con movimiento sin suavizar.
    expect(document.documentElement.classList.contains('cursor-none')).toBe(true);
  });
});
