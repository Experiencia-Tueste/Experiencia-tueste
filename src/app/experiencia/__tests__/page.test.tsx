import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { dynamic, ExperienceView as Home, metadata } from '../page';

describe('Experiencia (metadata)', () => {
  it('expone la metadata explícita de la experiencia', () => {
    expect(metadata.title).toBe('Tueste · Origen Tostado');
    expect(metadata.description).toBe(
      'Tueste · Origen Tostado. Café, música y ritual nacidos en el Eje Cafetero colombiano.',
    );
  });

  it('resuelve la proyección editorial en cada request', () => {
    expect(dynamic).toBe('force-dynamic');
  });
});

/**
 * Integración mínima de la composición real de `src/app/page.tsx`:
 * con el menú cerrado, el primer Tab del documento enfoca el SkipLink
 * (primer elemento del DOM, antes del Navbar).
 */
describe('Página pública (orden de foco por teclado)', () => {
  it('con el menú cerrado, el primer Tab enfoca el SkipLink', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.tab();

    expect(screen.getByRole('link', { name: 'Saltar al contenido principal' })).toHaveFocus();
  });
});

describe('Página pública (Manifiesto)', () => {
  it('expone el ancla #manifiesto y se inserta después del hero y antes de la escucha', () => {
    render(<Home />);

    expect(document.getElementById('manifiesto')).not.toBeNull();

    const headings = screen.getAllByRole('heading');
    const heroIndex = headings.findIndex((h) => h.textContent === 'OrigenTostado');
    const manifiestoIndex = headings.findIndex((h) => h.textContent === 'Manifiesto');
    const escuchaIndex = headings.findIndex((h) => h.textContent === 'Escucha el origen');

    expect(heroIndex).toBeGreaterThanOrEqual(0);
    expect(manifiestoIndex).toBeGreaterThan(heroIndex);
    expect(escuchaIndex).toBeGreaterThan(manifiestoIndex);
  });

  it('mantiene el contenido exacto del documento maestro', () => {
    render(<Home />);

    // Matcher por textContent completo: los párrafos con <del>/<em>
    // dividen el texto en varios nodos y getByText busca por nodo.
    // Se excluyen los wrappers de animación (data-reveal), que repiten
    // el textContent de su hijo.
    const byText = (text: string) => (_c: string, element?: Element | null) =>
      element?.textContent === text && !element.hasAttribute('data-reveal');

    expect(screen.getByText('La música nace del territorio.')).toBeInTheDocument();
    expect(screen.getByText('Las frecuencias nacen del sonido de la finca.')).toBeInTheDocument();
    expect(screen.getByText(byText('El café no acompaña a la música.'))).toBeInTheDocument();
    expect(screen.getByText(byText('La música nace del café.'))).toBeInTheDocument();
    expect(screen.getByText('— Origen Tostado · Eje Cafetero, Colombia')).toBeInTheDocument();
  });
});

describe('Página pública (ritmo editorial del master)', () => {
  const sigueA = (a: Element, b: Element) =>
    (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

  it('inserta las tres cintas editoriales en sus variantes', () => {
    render(<Home />);

    const tickers = Array.from(document.querySelectorAll('[data-variant]'));
    expect(tickers).toHaveLength(3);
    expect(tickers.filter((t) => t.getAttribute('data-variant') === 'amber')).toHaveLength(2);
    expect(tickers.filter((t) => t.getAttribute('data-variant') === 'dim')).toHaveLength(1);
  });

  it('mantiene el orden Hero → Manifiesto → cinta ámbar → Frecuencias', () => {
    render(<Home />);

    const hero = screen.getAllByRole('heading').find((h) => h.textContent === 'OrigenTostado')!;
    const manifiesto = document.getElementById('manifiesto')!;
    const frecuencias = document.getElementById('frecuencias')!;
    const cintaAmbar = document.querySelector('[data-variant="amber"]')!;

    expect(sigueA(hero, manifiesto)).toBe(true);
    expect(sigueA(manifiesto, cintaAmbar)).toBe(true);
    expect(sigueA(cintaAmbar, frecuencias)).toBe(true);
  });

  it('inserta la cinta tenue entre Barista (#recetario) y Eventos (#eventos)', () => {
    render(<Home />);

    const recetario = document.getElementById('recetario')!;
    const eventos = document.getElementById('eventos')!;
    const cintaTenue = document.querySelector('[data-variant="dim"]')!;

    expect(sigueA(recetario, cintaTenue)).toBe(true);
    expect(sigueA(cintaTenue, eventos)).toBe(true);
  });

  it('inserta la cinta ámbar final entre Tienda (#merch) y el bloque Para negocios (#negocios)', () => {
    render(<Home />);

    const merch = document.getElementById('merch')!;
    const negocios = document.getElementById('negocios')!;
    const cintas = Array.from(document.querySelectorAll('[data-variant="amber"]'));
    const cintaFinal = cintas[cintas.length - 1];

    expect(sigueA(merch, cintaFinal)).toBe(true);
    expect(sigueA(cintaFinal, negocios)).toBe(true);
  });

  it('integra las cinco plataformas dentro de la sección Lanzamientos', () => {
    render(<Home />);

    const lanzamientos = document.getElementById('lanzamientos')!;
    const plataformas = document.getElementById('plataformas')!;
    expect(sigueA(lanzamientos, plataformas)).toBe(true);

    for (const nombre of ['Spotify', 'Apple Music', 'Beatport', 'YouTube', 'SoundCloud']) {
      expect(
        screen.getByText(nombre),
        `plataforma ${nombre} dentro de Lanzamientos`,
      ).toBeInTheDocument();
    }
  });
});

describe('Página pública (números fantasma de sección)', () => {
  it('inserta exactamente nueve SectionGhosts con sus números', () => {
    render(<Home />);

    const ghosts = Array.from(document.querySelectorAll('[data-section-ghost]'));
    expect(ghosts).toHaveLength(9);
    expect(ghosts.map((g) => g.getAttribute('data-section-ghost'))).toEqual([
      '01',
      '02',
      '03',
      '04',
      '05',
      '07',
      '08',
      '09',
      '10',
    ]);
  });

  it('cada sección numerada contiene su fantasma y ninguno vive en #negocios ni #plataformas', () => {
    render(<Home />);

    const esperados: Array<[string, string]> = [
      ['frecuencias', '01'],
      ['origen', '02'],
      ['lanzamientos', '03'],
      ['recetario', '04'],
      ['eventos', '05'],
      ['merch', '07'],
      ['radio', '08'],
      ['mercado', '09'],
      ['comunidad', '10'],
    ];

    for (const [id, numero] of esperados) {
      const seccion = document.getElementById(id)!;
      const ghost = seccion.querySelector(`[data-section-ghost="${numero}"]`);
      expect(ghost, `#${id} debe contener el fantasma ${numero}`).not.toBeNull();
    }

    const negocios = document.getElementById('negocios')!;
    const plataformas = document.getElementById('plataformas')!;
    expect(negocios.querySelector('[data-section-ghost]')).toBeNull();
    expect(plataformas.querySelector('[data-section-ghost]')).toBeNull();
  });

  it('el fantasma de Comunidad está alineado a la izquierda', () => {
    render(<Home />);

    const comunidad = document.getElementById('comunidad')!;
    const ghost = comunidad.querySelector('[data-section-ghost="10"]')!;
    expect(ghost.className).toContain('start');
  });
});

describe('Página pública (CTA comerciales sin pagos)', () => {
  it('los lanzamientos exponen intención comercial estable y no fingen compra', () => {
    render(<Home />);

    const proximamente = document.querySelectorAll('[data-commercial-intent^="release-"]');
    expect(proximamente.length).toBeGreaterThan(0);
    for (const el of proximamente) {
      expect(el.getAttribute('data-commercial-intent')).toMatch(/^release-[a-z0-9-]+$/);
    }
    // Sin enlaces vacíos ni javascript:.
    const enlaces = Array.from(document.querySelectorAll('a'));
    for (const a of enlaces) {
      expect(a.getAttribute('href')).not.toBe('#');
      expect(a.getAttribute('href')).not.toMatch(/^javascript:/);
    }
  });

  it('la tienda y el mercado exponen intención comercial estable', () => {
    render(<Home />);

    expect(document.querySelectorAll('[data-commercial-intent^="merch-"]').length).toBeGreaterThan(
      0,
    );
    expect(
      document.querySelectorAll('[data-commercial-intent^="availability-"]').length,
    ).toBeGreaterThan(0);
  });
});

describe('Página pública (animación de entrada por scroll)', () => {
  it('envuelve los bloques principales de cada sección en Reveal (data-reveal)', () => {
    render(<Home />);

    const secciones: string[] = [
      'top',
      'manifiesto',
      'frecuencias',
      'origen',
      'lanzamientos',
      'plataformas',
      'recetario',
      'eventos',
      'merch',
      'negocios',
      'radio',
      'mercado',
      'comunidad',
    ];

    for (const id of secciones) {
      const bloque = document.getElementById(id)!;
      expect(
        bloque.querySelector('[data-reveal]'),
        `#${id} debe contener al menos un bloque con data-reveal`,
      ).not.toBeNull();
    }
  });

  it('el hero anima el titular, la tagline, los CTAs y las stats', () => {
    render(<Home />);

    const hero = document.getElementById('top')!;
    const titulo = hero.querySelector('h1')!;
    const tagline = Array.from(hero.querySelectorAll('p')).find((p) =>
      p.textContent?.includes('El café también se escucha'),
    )!;
    const ctas = hero.querySelector('a[href="#frecuencias"]')!;
    const stats = hero.querySelector('a[href="#lanzamientos"]')!;

    expect(titulo.closest('[data-reveal]')).not.toBeNull();
    expect(tagline.closest('[data-reveal]')).not.toBeNull();
    expect(ctas.closest('[data-reveal]')).not.toBeNull();
    expect(stats.closest('[data-reveal]')).not.toBeNull();
  });

  it('el hero ya no muestra el texto gigante decorativo de fondo', () => {
    render(<Home />);

    const hero = document.getElementById('top')!;
    // El fantasma eliminado era el único elemento cuyo texto exacto era «Frecuencia».
    expect(hero.querySelector('[class*="ghost"]')).toBeNull();
    const textosExactos = Array.from(hero.querySelectorAll('*')).map((el) =>
      el.textContent?.trim(),
    );
    expect(textosExactos).not.toContain('Frecuencia');
  });

  it('no envuelve los anuncios aria-live en bloques de animación', () => {
    render(<Home />);

    const lives = Array.from(document.querySelectorAll('[role="status"]'));
    expect(lives.length).toBeGreaterThan(0);
    for (const live of lives) {
      expect(live.closest('[data-reveal]'), 'aria-live no debe ocultarse').toBeNull();
    }
  });

  it('tienda, mercado y lanzamientos usan los assets locales integrados', () => {
    render(<Home />);

    const imgs = Array.from(
      document.querySelectorAll('#merch img, #mercado img, #lanzamientos img'),
    );
    expect(imgs.length).toBeGreaterThanOrEqual(13);

    for (const img of imgs) {
      const src = decodeURIComponent(img.getAttribute('src') ?? '');
      // Rutas locales bajo public/images (nunca externas ni data:).
      expect(src.startsWith('http://')).toBe(false);
      expect(src.startsWith('https://')).toBe(false);
      expect(src.startsWith('data:')).toBe(false);
      expect(src).toMatch(/\/images\/(store|mercado|releases)\//);
      expect(img.getAttribute('alt')?.length).toBeGreaterThan(0);
    }
  });
});
