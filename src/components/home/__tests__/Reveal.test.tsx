import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Reveal from '../Reveal';

/**
 * jsdom no implementa IntersectionObserver: el componente debe quedar
 * visible (clase `in`) sin observador, y con un mock del observador debe
 * revelarse solo al intersectar (threshold 0.12, como el master).
 */
function mockIntersectionObserver() {
  const callbacks = new Map<Element, IntersectionObserverCallback>();
  const observe = vi.fn((el: Element) => {
    // El mock registra el callback por elemento para poder emitir entradas.
    callbacks.set(el, ioInstance.callback);
  });
  const disconnect = vi.fn();
  const ioInstance = {
    callback: (() => {}) as IntersectionObserverCallback,
    observe,
    disconnect,
    unobserve: vi.fn(),
    takeRecords: vi.fn(() => []),
    root: null,
    rootMargin: '',
    thresholds: [0.12],
  };
  const MockIO = vi.fn((cb: IntersectionObserverCallback) => {
    ioInstance.callback = cb;
    return ioInstance;
  });
  vi.stubGlobal('IntersectionObserver', MockIO);
  return { MockIO, io: ioInstance, ioInstance, callbacks };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Reveal (animación de entrada por scroll)', () => {
  it('envuelve el contenido con data-reveal y lo deja visible sin IntersectionObserver', () => {
    const { container } = render(
      <Reveal>
        <p>Contenido real</p>
      </Reveal>,
    );

    const wrapper = container.querySelector('[data-reveal]');
    expect(wrapper).not.toBeNull();
    expect(wrapper!.textContent).toBe('Contenido real');
    // Sin IO (jsdom): visible desde el primer render.
    expect(wrapper!.className).toContain('in');
  });

  it('con IntersectionObserver, se revela solo al intersectar y se desconecta', () => {
    const { io, ioInstance } = mockIntersectionObserver();

    const { container } = render(
      <Reveal>
        <p>Bloque</p>
      </Reveal>,
    );

    const wrapper = container.querySelector('[data-reveal]')!;
    expect(io.observe).toHaveBeenCalledWith(wrapper);
    expect(wrapper.className).not.toContain('in');

    // Entra en viewport (threshold 0.12): se añade `in` y se desconecta.
    act(() => {
      ioInstance.callback(
        [{ isIntersecting: true, target: wrapper } as IntersectionObserverEntry],
        ioInstance as unknown as IntersectionObserver,
      );
    });
    expect(wrapper.className).toContain('in');
    expect(io.disconnect).toHaveBeenCalled();
  });

  it('no se revela si el bloque aún no intersecta', () => {
    const { ioInstance } = mockIntersectionObserver();

    const { container } = render(
      <Reveal>
        <p>Fuera de vista</p>
      </Reveal>,
    );

    const wrapper = container.querySelector('[data-reveal]')!;
    act(() => {
      ioInstance.callback(
        [{ isIntersecting: false, target: wrapper } as IntersectionObserverEntry],
        ioInstance as unknown as IntersectionObserver,
      );
    });
    expect(wrapper.className).not.toContain('in');
  });

  it('acepta una clase adicional sin romper el wrapper', () => {
    const { container } = render(
      <Reveal className="extra">
        <p>Con clase</p>
      </Reveal>,
    );
    const wrapper = container.querySelector('[data-reveal]')!;
    expect(wrapper.className).toContain('extra');
  });
});
