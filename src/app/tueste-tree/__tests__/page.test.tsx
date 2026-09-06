import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TuesteTreePage, { metadata } from '../page';

/**
 * Pruebas del dashboard de Tueste Tree (/tueste-tree) como aplicación:
 * sidebar, cabecera compacta, progreso, accesos, Mi árbol, cultivo,
 * lote/drops, modelo, ecosistema, promesa, territorio y comunidad.
 * Sin hero publicitario, sin imagen de cafetal en el primer bloque.
 */

const SOURCE = readFileSync(resolve(__dirname, '../page.tsx'), 'utf-8');

describe('TuesteTree dashboard (metadata)', () => {
  it('expone la metadata propia de la ruta', () => {
    expect(metadata.title).toBe('Tueste Tree · Panel de adopción');
    expect(metadata.description).toContain('10.200 árboles');
  });
});

describe('TuesteTree dashboard (sidebar de aplicación)', () => {
  it('la sidebar organiza los enlaces por adopción, proyecto y comunidad', () => {
    render(<TuesteTreePage />);

    expect(
      screen.getByRole('navigation', { name: 'Navegación de Tueste Tree' }),
    ).toBeInTheDocument();
    for (const label of [
      'Panel de adopción',
      'Mi árbol',
      'El cultivo',
      'Tu certificado',
      'Los lotes',
      'El modelo',
      'El retorno',
      'La promesa',
      'El territorio',
      'Comunidad',
      'Inquietudes',
      'El ecosistema',
    ]) {
      expect(screen.getByRole('link', { name: new RegExp(`^${label}$`) })).toBeInTheDocument();
    }

    const activo = screen.getByRole('link', { name: 'Panel de adopción' });
    expect(activo).toHaveAttribute('aria-current', 'page');
    expect(activo).toHaveAttribute('href', '/tueste-tree');

    expect(screen.getByRole('link', { name: 'Mi árbol' })).toHaveAttribute(
      'aria-current',
      'location',
    );
  });

  it('la sidebar conserva la marca y un único ThemeToggle global', () => {
    render(<TuesteTreePage />);

    expect(screen.getByRole('img', { name: 'Logo de Tueste' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Cambiar a modo (día|noche)/ })).toHaveLength(1);
  });

  it('destaca la sección visible al recorrer el dashboard', () => {
    const observers: Array<{
      callback: IntersectionObserverCallback;
      disconnect: () => void;
    }> = [];
    const previousObserver = window.IntersectionObserver;

    class TestIntersectionObserver {
      callback: IntersectionObserverCallback;

      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        observers.push(this);
      }

      observe() {}

      disconnect() {}

      unobserve() {}

      takeRecords() {
        return [];
      }
    }

    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: TestIntersectionObserver,
    });

    try {
      render(<TuesteTreePage />);
      const cultivo = document.getElementById('cultivo-dash');

      expect(cultivo).not.toBeNull();
      if (!cultivo) {
        throw new Error('La sección de cultivo debe existir para la navegación lateral.');
      }

      act(() => {
        observers[0].callback(
          [
            {
              target: cultivo,
              isIntersecting: true,
              intersectionRatio: 0.45,
            } as unknown as IntersectionObserverEntry,
          ],
          observers[0] as unknown as IntersectionObserver,
        );
      });

      expect(screen.getByRole('link', { name: 'El cultivo' })).toHaveAttribute(
        'aria-current',
        'location',
      );
      expect(screen.getByRole('link', { name: 'Mi árbol' })).not.toHaveAttribute('aria-current');
    } finally {
      if (previousObserver) {
        Object.defineProperty(window, 'IntersectionObserver', {
          configurable: true,
          value: previousObserver,
        });
      } else {
        Reflect.deleteProperty(window, 'IntersectionObserver');
      }
    }
  });
});

describe('TuesteTree dashboard (cabecera compacta y progreso)', () => {
  it('la cabecera es compacta: título, ventana y lectura del Drop', () => {
    render(<TuesteTreePage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Panel de adopción' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ventana fundacional abierta/)).toBeInTheDocument();
    expect(screen.getByText('64 / 300')).toBeInTheDocument();
  });

  it('no existe el hero publicitario con imagen de cafetal', () => {
    render(<TuesteTreePage />);

    // El dashboard de la referencia no usa la imagen grande del cafetal.
    expect(screen.queryByRole('img', { name: /Cafetal del Lote 000/ })).not.toBeInTheDocument();
  });

  it('muestra el progreso del proyecto con leyenda demostrativa', () => {
    render(<TuesteTreePage />);

    expect(screen.getByText('Avance del proyecto fundacional')).toBeInTheDocument();
    expect(screen.getByText('Adoptados')).toBeInTheDocument();
    expect(screen.getByText('Liberado en drops')).toBeInTheDocument();
    expect(screen.getByText('Por liberar')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Cifras de referencia editorial, no una oferta pública ni un estado real de ventas.',
      ),
    ).toBeInTheDocument();
  });

  it('muestra las tarjetas de navegación del panel', () => {
    render(<TuesteTreePage />);

    expect(screen.getByRole('link', { name: /Elige tu árbol/ })).toHaveAttribute(
      'href',
      '/tueste-tree/adoptar',
    );

    const miArbol = screen.getAllByRole('link', { name: /Mi árbol/ });
    expect(miArbol.some((l) => l.getAttribute('href') === '/tueste-tree#mi-arbol')).toBe(true);

    const cultivo = screen.getAllByRole('link', { name: /El cultivo/i });
    expect(cultivo.some((l) => l.getAttribute('href') === '/tueste-tree#cultivo-dash')).toBe(true);
  });
});

describe('TuesteTree dashboard (Mi árbol y cultivo)', () => {
  it('estado vacío «Todo empieza eligiendo un árbol.» con datos y CTA', () => {
    render(<TuesteTreePage />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Todo empieza eligiendo un árbol.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Elegir mi árbol/ })).toHaveAttribute(
      'href',
      '/tueste-tree/adoptar',
    );
    expect(
      screen.getByText('1.840 m · Quindío · Var. Castillo · sombra 32% · Finca Tres Esquinas'),
    ).toBeInTheDocument();
  });

  it('el cultivo muestra el título, la terraza y soles enlazados al flujo', () => {
    render(<TuesteTreePage />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Cada sol es un árbol real del Lote 000.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Terraza 1–4 · Finca Tres Esquinas · Paisaje Cultural Cafetero'),
    ).toBeInTheDocument();
    const disponibles = screen.getAllByRole('link', { name: /Elegir árbol \d{3} del Lote 000/ });
    expect(disponibles.length).toBeGreaterThan(0);
    for (const sol of disponibles) {
      expect(sol).toHaveAttribute('href', '/tueste-tree/adoptar');
    }
  });
});

describe('TuesteTree dashboard (secciones posteriores)', () => {
  it('muestra certificado, territorio y comunidad con FAQ', () => {
    render(<TuesteTreePage />);

    expect(
      screen.getAllByText(/El certificado se emite en las primeras 48 horas\./).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('El origen se cuida también al nombrarlo')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Comunidad y ayuda' }),
    ).toBeInTheDocument();
    expect(screen.getByText('¿Qué significa cofundar?')).toBeInTheDocument();
  });

  it('muestra lote/drops, modelo con KPIs, ecosistema y promesa', () => {
    render(<TuesteTreePage />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'La adopción se abre por drops.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('300 árboles · 64 adoptados')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Los primeros 10.200 árboles.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('USD 1,02M')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('Cuatro motores que se alimentan entre sí.')).toBeInTheDocument();
    expect(screen.getByText(/Prometemos menos\. Cumplimos siempre\./)).toBeInTheDocument();
    expect(screen.getAllByText(/no constituyen oferta pública/).length).toBeGreaterThan(0);
  });

  it('el código de la ruta no contiene patrones prohibidos ni mapas', () => {
    for (const forbidden of [
      'fetch(',
      'process.env',
      'localStorage',
      'sessionStorage',
      'Math.random(',
      'Date.now(',
      'new Date(',
      'suppressHydrationWarning',
      'maplibre',
      'maptiler',
    ]) {
      expect(SOURCE).not.toContain(forbidden);
    }
  });
});
