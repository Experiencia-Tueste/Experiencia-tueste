import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AdoptionCycle from '../components/AdoptionCycle';

/**
 * Pruebas del ciclo interactivo: render inicial determinista (sin
 * acceso a `window`), preferencia de movimiento, limpieza del listener
 * y cambio de preferencia en sesión.
 */

// El mock local de la imagen evita el contexto de Next fuera de la app:
// la cobertura real de las fotografías vive en adoption-page.test.tsx.
vi.mock('next/image', () => ({
  default: (props: { src: string; alt?: string }) =>
    createElement('img', { src: props.src, alt: props.alt ?? '' }),
}));

interface MediaStub {
  removeSpy: ReturnType<typeof vi.fn>;
  fireChange: (matches: boolean) => void;
}

function stubMatchMedia(initialMatches: boolean): MediaStub {
  let matches = initialMatches;
  const changeListeners: Array<() => void> = [];
  const removeSpy = vi.fn();

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      get matches() {
        return matches;
      },
      addEventListener: (_type: string, cb: () => void) => {
        changeListeners.push(cb);
      },
      removeEventListener: removeSpy,
      addListener: (cb: () => void) => {
        changeListeners.push(cb);
      },
      removeListener: removeSpy,
    })),
  );

  return {
    removeSpy,
    fireChange: (next: boolean) => {
      matches = next;
      for (const cb of changeListeners) cb();
    },
  };
}

function outgoingCard(): Element | null {
  // El componente se renderiza aislado (sin la sección #ciclo de la
  // página): la tarjeta saliente es el article oculto del widget.
  return document.querySelector('article[aria-hidden="true"]');
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('AdoptionCycle (render inicial determinista)', () => {
  it('no consulta window ni matchMedia durante el primer render', () => {
    // Si el render (no el efecto) consultara matchMedia, esta función
    // lanzaría y el test fallaría. renderToStaticMarkup no ejecuta
    // efectos: solo valida la fase de render.
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => {
        throw new Error('matchMedia no debe consultarse durante el render inicial');
      }),
    );

    const html = renderToStaticMarkup(<AdoptionCycle />);

    // El render inicial es determinista: una única tarjeta activa con
    // la etapa 01 y el progreso compacto en «1 de 5».
    expect(html).toContain('>Germinación</h3>');
    expect(html).toContain('Etapa 1 de 5');
    expect(html.match(/<article/g)).toHaveLength(1);
  });
});

describe('AdoptionCycle (preferencia de movimiento)', () => {
  it('con movimiento normal, avanzar produce la transición animada', async () => {
    const user = userEvent.setup();
    stubMatchMedia(false);

    render(<AdoptionCycle />);

    expect(outgoingCard()).toBeNull();

    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    expect(screen.getByRole('heading', { level: 3, name: 'Floración' })).toBeInTheDocument();
    // La tarjeta saliente (aria-hidden) existe solo durante la animación.
    expect(outgoingCard()).not.toBeNull();
  });

  it('con prefers-reduced-motion el cambio de etapa es inmediato', async () => {
    const user = userEvent.setup();
    stubMatchMedia(true);

    render(<AdoptionCycle />);

    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    expect(screen.getByRole('heading', { level: 3, name: 'Floración' })).toBeInTheDocument();
    // Sin animación: no queda tarjeta saliente ni estado temporal bloqueado.
    expect(outgoingCard()).toBeNull();
  });

  it('limpia el listener de la preferencia al desmontar', () => {
    const stub = stubMatchMedia(false);

    const { unmount } = render(<AdoptionCycle />);
    unmount();

    expect(stub.removeSpy).toHaveBeenCalled();
  });

  it('reacciona a un cambio de preferencia durante la sesión', async () => {
    const user = userEvent.setup();
    const stub = stubMatchMedia(false);

    render(<AdoptionCycle />);

    // El usuario activa el movimiento reducido a mitad de sesión.
    await act(async () => {
      stub.fireChange(true);
    });

    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    expect(screen.getByRole('heading', { level: 3, name: 'Floración' })).toBeInTheDocument();
    expect(outgoingCard()).toBeNull();
  });
});
