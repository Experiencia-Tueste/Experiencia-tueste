import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import AdoptaPage, { metadata } from '@/app/adopta/page';

/**
 * Pruebas de la experiencia /adopta (mockup editorial fotográfico).
 * Cubre estructura, contenidos exactos, línea de tiempo interactiva,
 * mapa reutilizado, accesibilidad y ausencia de patrones prohibidos.
 */

const ADOPTION_DIR = join(process.cwd(), 'src', 'features', 'adoption');
const ADOPTA_PAGE = join(process.cwd(), 'src', 'app', 'adopta', 'page.tsx');

function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      // Los propios tests contienen los patrones como literales: no se escanean.
      if (entry === '__tests__') continue;
      files.push(...collectSourceFiles(full));
    } else if (/\.(ts|tsx|css)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

/** Imagen actual de la tarjeta activa del ciclo (excluye la saliente aria-hidden). */
function cycleActiveImage(): HTMLImageElement {
  const card = document.querySelector('#ciclo article:not([aria-hidden="true"])');
  expect(card).not.toBeNull();
  return card!.querySelector('img') as HTMLImageElement;
}

function decodedSrc(img: HTMLImageElement): string {
  return decodeURIComponent(img.getAttribute('src') ?? '');
}

function renderAdopta() {
  return render(<AdoptaPage />);
}

describe('AdoptaPage (metadata)', () => {
  it('expone la metadata propia de la ruta', () => {
    expect(metadata.title).toBe('Adopta tu árbol | Tueste');
    expect(metadata.description).toBe(
      'Una experiencia editorial para acompañar el ciclo del café en Finca Tres Esquinas.',
    );
  });
});

describe('AdoptaPage (estructura)', () => {
  it('renderiza las seis secciones en el mismo orden', () => {
    const { container } = renderAdopta();

    const ids = ['inicio', 'vinculo', 'ciclo', 'territorio', 'acompanamiento', 'cierre'];
    const sections = Array.from(container.querySelectorAll('main section')).map((s) => s.id);
    expect(sections).toEqual(ids);
  });

  it('presenta el hero con los textos exactos y el CTA a #ciclo', () => {
    renderAdopta();

    expect(screen.getByText('ADOPTA · FINCA TRES ESQUINAS')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Un árbol también guarda memoria.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Adoptar un árbol es acompañar un ciclo: tierra, lluvia, flor, cereza y una taza que conserva el origen.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Conoce el ciclo/ })).toHaveAttribute('href', '#ciclo');
  });

  it('el hero usa el archivo fotográfico correcto', () => {
    const { container } = renderAdopta();

    const hero = container.querySelector('#inicio img');
    expect(hero).not.toBeNull();
    expect(decodedSrc(hero as HTMLImageElement)).toContain(
      '/images/adopta/adopta-hero-cafeto-joven-v1.webp',
    );
    expect((hero as HTMLImageElement).getAttribute('alt')).toBe(
      'Cafeto joven creciendo en una finca de montaña al amanecer',
    );
  });

  it('no queda Canvas decorativo en el hero ni en la página', () => {
    renderAdopta();

    expect(document.querySelector('canvas')).toBeNull();
  });

  it('muestra los tres vínculos con sus textos exactos', () => {
    renderAdopta();

    expect(screen.getByRole('heading', { level: 3, name: 'Semilla' })).toBeInTheDocument();
    expect(screen.getByText('El comienzo: una intención puesta en la tierra.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Árbol joven' })).toBeInTheDocument();
    expect(
      screen.getByText('Un ciclo que empieza a encontrar su propia sombra.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Árbol guardián' })).toBeInTheDocument();
    expect(screen.getByText('Una presencia que acompaña la memoria del lote.')).toBeInTheDocument();
  });

  it('las tres tarjetas usan las tres imágenes correctas', () => {
    const { container } = renderAdopta();

    const bondImages = Array.from(container.querySelectorAll('#vinculo img'));
    const images = bondImages.map((img) => decodedSrc(img as HTMLImageElement));
    expect(images).toEqual(
      expect.arrayContaining([
        expect.stringContaining('/images/adopta/vinculo-semilla-v1.webp'),
        expect.stringContaining('/images/adopta/vinculo-arbol-joven-v1.webp'),
        expect.stringContaining('/images/adopta/vinculo-arbol-guardian-v1.webp'),
      ]),
    );
    expect(images).toHaveLength(3);

    const alts = bondImages.map((img) => img.getAttribute('alt'));
    expect(alts).toEqual([
      'Semilla de café germinando en suelo húmedo',
      'Cafeto joven cuidado por manos de una persona productora',
      'Cafeto adulto cargado de cerezas maduras en la montaña',
    ]);
  });

  it('presenta el cierre con la frase, el CTA a #inicio y la nota de mockup', () => {
    renderAdopta();

    expect(
      screen.getByRole('heading', { level: 2, name: 'No adoptas un objeto: acompañas un ciclo.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Volver al origen/ })).toHaveAttribute(
      'href',
      '#inicio',
    );
    expect(
      screen.getByText('Mockup editorial · pendiente de validación con José.'),
    ).toBeInTheDocument();
  });
});

describe('AdoptaPage (ciclo interactivo)', () => {
  it('la etapa inicial es Germinación', () => {
    renderAdopta();

    const ciclo = document.getElementById('ciclo')!;
    expect(
      within(ciclo).getByRole('heading', { level: 3, name: 'Germinación' }),
    ).toBeInTheDocument();
    expect(decodedSrc(cycleActiveImage())).toContain('/images/adopta/ciclo-germinacion-v1.webp');
  });

  it('«Siguiente» cambia a Floración y «Anterior» regresa a Germinación', async () => {
    const user = userEvent.setup();
    renderAdopta();

    const next = screen.getByRole('button', { name: /Siguiente/ });
    const prev = screen.getByRole('button', { name: /Anterior/ });

    await user.click(next);
    expect(screen.getByRole('heading', { level: 3, name: 'Floración' })).toBeInTheDocument();
    expect(decodedSrc(cycleActiveImage())).toContain('/images/adopta/ciclo-floracion-v1.webp');

    await user.click(prev);
    expect(screen.getByRole('heading', { level: 3, name: 'Germinación' })).toBeInTheDocument();
  });

  it('«Anterior» está deshabilitado en la primera etapa y «Siguiente» en la última', async () => {
    const user = userEvent.setup();
    renderAdopta();

    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Siguiente/ })).toBeEnabled();

    const next = screen.getByRole('button', { name: /Siguiente/ });
    await user.click(next);
    await user.click(next);
    await user.click(next);
    await user.click(next);

    expect(screen.getByRole('button', { name: /Siguiente/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Anterior/ })).toBeEnabled();
  });

  it('el indicador activo usa aria-current="step"', () => {
    renderAdopta();

    const current = document.querySelectorAll('#ciclo [aria-current="step"]');
    expect(current).toHaveLength(1);
    const indicators = document.querySelectorAll('#ciclo button[aria-label^="Ir a la etapa"]');
    expect(indicators).toHaveLength(5);
  });

  it('las flechas de teclado cambian de etapa cuando el widget tiene foco', async () => {
    const user = userEvent.setup();
    renderAdopta();

    const widget = screen.getByRole('group', { name: /Ciclo del árbol/ });
    widget.focus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('heading', { level: 3, name: 'Floración' })).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('heading', { level: 3, name: 'Germinación' })).toBeInTheDocument();
  });

  it('las cinco imágenes del ciclo están vinculadas a sus etapas', async () => {
    const user = userEvent.setup();
    renderAdopta();

    const expected = [
      ['Germinación', '/images/adopta/ciclo-germinacion-v1.webp'],
      ['Floración', '/images/adopta/ciclo-floracion-v1.webp'],
      ['Cereza', '/images/adopta/ciclo-cereza-v1.webp'],
      ['Cosecha', '/images/adopta/ciclo-cosecha-v1.webp'],
      ['Tu taza', '/images/adopta/ciclo-taza-v1.webp'],
    ] as const;

    const next = screen.getByRole('button', { name: /Siguiente/ });
    for (const [name, src] of expected) {
      expect(screen.getByRole('heading', { level: 3, name })).toBeInTheDocument();
      expect(decodedSrc(cycleActiveImage())).toContain(src);
      if (name !== 'Tu taza') await user.click(next);
    }
  });
});

describe('AdoptaPage (territorio con el mapa existente)', () => {
  it('la sección reutiliza OrigenMapPreview con el punto de la finca', () => {
    renderAdopta();

    expect(document.querySelector('[data-origen-map-preview]')).not.toBeNull();
    expect(document.querySelector('[data-origen-map-fallback]')?.textContent).toContain(
      'Finca Tres Esquinas',
    );
  });

  it('la región del mapa no tiene aria-hidden', () => {
    renderAdopta();

    const region = document.querySelector('[data-origen-map-container]');
    expect(region).not.toBeNull();
    expect(region!.getAttribute('role')).toBe('region');
    expect(region!.getAttribute('aria-hidden')).toBeNull();
  });

  it('la etiqueta de ubicación aproximada permanece visible', () => {
    renderAdopta();

    expect(screen.getByText('UBICACIÓN APROXIMADA · QUINDÍO, COLOMBIA')).toBeInTheDocument();
  });

  it('no se muestran coordenadas en pantalla', () => {
    renderAdopta();

    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/\d+°\d+/);
    expect(text).not.toMatch(/\d+°\d+′/);
    expect(text).not.toMatch(/°\s?[NSEW]\s·/);
  });
});

describe('AdoptaPage (memorias)', () => {
  it('las cuatro memorias usan sus imágenes correctas', () => {
    const { container } = renderAdopta();

    const images = Array.from(container.querySelectorAll('#acompanamiento img')).map((img) =>
      decodedSrc(img as HTMLImageElement),
    );
    expect(images).toEqual(
      expect.arrayContaining([
        expect.stringContaining('/images/adopta/memoria-bitacora-v1.webp'),
        expect.stringContaining('/images/adopta/memoria-carta-v1.webp'),
        expect.stringContaining('/images/adopta/memoria-cafe-v1.webp'),
        expect.stringContaining('/images/adopta/memoria-ritual-v1.webp'),
      ]),
    );
    expect(images).toHaveLength(4);

    expect(screen.getByText('PROPUESTA EDITORIAL')).toBeInTheDocument();
  });
});

describe('AdoptaPage (sin lenguaje comercial ni datos dinámicos)', () => {
  it('no hay precio, pago, compra, checkout, WhatsApp ni suscripción', () => {
    renderAdopta();

    const text = document.body.textContent?.toLowerCase() ?? '';
    for (const forbidden of [
      'precio',
      'comprar',
      'pagar',
      'checkout',
      'whatsapp',
      'suscripción',
      'suscribirme',
      'cupos',
      'stock',
    ]) {
      expect(text).not.toContain(forbidden);
    }

    const links = Array.from(document.querySelectorAll('a')).map(
      (a) => a.getAttribute('href') ?? '',
    );
    expect(links.every((href) => !href.includes('wa.me') && !href.includes('whatsapp'))).toBe(true);
  });

  it('las imágenes del DOM son locales (sin URLs externas ni Base64)', () => {
    renderAdopta();

    for (const img of Array.from(document.querySelectorAll('img'))) {
      const src = decodedSrc(img);
      expect(src.startsWith('http://')).toBe(false);
      expect(src.startsWith('https://')).toBe(false);
      expect(src.startsWith('data:')).toBe(false);
    }
  });
});

describe('AdoptaPage (elementos globales de Tueste)', () => {
  it('renderiza el SkipLink y apunta al contenido principal', () => {
    renderAdopta();

    const skip = screen.getByRole('link', { name: 'Saltar al contenido principal' });
    expect(skip).toHaveAttribute('href', '#contenido');
    expect(document.getElementById('contenido')).not.toBeNull();
  });

  it('usa exactamente un control de tema global', () => {
    renderAdopta();

    const toggles = screen.getAllByRole('button', { name: /Cambiar a modo (día|noche)/ });
    expect(toggles).toHaveLength(1);
  });

  it('el encabezado conserva el enlace de marca a la raíz', () => {
    renderAdopta();

    const brand = screen.getByRole('link', { name: 'Tueste' });
    expect(brand).toHaveAttribute('href', '/');
  });
});

describe('AdoptaPage (código fuente de la ruta)', () => {
  it('no contiene patrones prohibidos', () => {
    const files = [ADOPTA_PAGE, ...collectSourceFiles(ADOPTION_DIR)];
    expect(files.length).toBeGreaterThan(5);

    const forbidden = [
      'fetch(',
      'process.env',
      'localStorage',
      'sessionStorage',
      'Math.random(',
      'Math.sin(',
      'Math.cos(',
      'Math.tan(',
      'Date.now(',
      'new Date(',
      'data:image',
      'suppressHydrationWarning',
    ];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      for (const pattern of forbidden) {
        expect(source, `${file} no debe contener «${pattern}»`).not.toContain(pattern);
      }
    }
  });
});
