import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import AdoptarPage, { metadata } from '../page';
import { ARBOLES_GROVE } from '@/features/tueste-tree/data/cultivo';

/**
 * Pruebas del ritual de adopción (/tueste-tree/adoptar): hero con dos
 * CTA y métricas, cultivo de 300 árboles, ritual por etapas (un paso a
 * la vez), certificado/bitácora y modelo fundacional. Sin pagos, red,
 * persistencia ni mapas.
 */

const SOURCE = readFileSync(resolve(__dirname, '../page.tsx'), 'utf-8');

describe('Tueste Tree adopción (metadata y hero)', () => {
  it('expone la metadata propia de la ruta', () => {
    expect(metadata.title).toBe('Adopta un árbol · Tueste Tree');
    expect(metadata.description).toContain('Lote 000');
    expect(metadata.description).not.toMatch(/cofund/);
  });

  it('presenta el hero con el eyebrow del Drop abierto y el título exacto', () => {
    render(<AdoptarPage />);

    expect(screen.getByText('DROP ABIERTO · 10.200 ÁRBOLES')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Adopta un árbol. Sé su Guardián.' }),
    ).toBeInTheDocument();
  });

  it('tiene los dos CTA: «Elegir mi árbol» → #cultivo y «Ver insignias» → #modelo', () => {
    render(<AdoptarPage />);

    expect(screen.getByRole('link', { name: /Elegir mi árbol/ })).toHaveAttribute(
      'href',
      '#cultivo',
    );
    expect(screen.getByRole('link', { name: /Ver insignias/ })).toHaveAttribute('href', '#modelo');
  });

  it('muestra las tres métricas editoriales', () => {
    render(<AdoptarPage />);

    expect(screen.getAllByText('Café por árbol').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2 bolsas de 340 g').length).toBeGreaterThan(0);
    expect(screen.getByText('Certificado')).toBeInTheDocument();
    expect(screen.getByText('Territorio')).toBeInTheDocument();
    expect(screen.getByText('1.840 m')).toBeInTheDocument();
  });
});

describe('Tueste Tree adopción (cultivo de 300 árboles)', () => {
  it('existen 300 árboles deterministas en el lote', () => {
    expect(ARBOLES_GROVE).toHaveLength(300);
  });

  it('la cuadrícula inicial muestra el paso 01 (cultivo) sin los demás pasos', () => {
    render(<AdoptarPage />);

    const disponibles = screen.getAllByRole('button', {
      name: /Seleccionar árbol \d{3} del Lote 000/,
    });
    const adoptados = document.querySelectorAll('[aria-label*="adoptado"]');
    expect(disponibles.length + adoptados.length).toBe(300);

    // El ritual no muestra simultáneamente los demás estados.
    expect(screen.queryByLabelText('Nombre de tu árbol')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Insignia / })).not.toBeInTheDocument();
    expect(screen.queryByText('CERTIFICADO DE GUARDIÁN · VISTA PREVIA')).not.toBeInTheDocument();
  });

  it('los árboles adoptados no son interactivos', () => {
    render(<AdoptarPage />);

    const adoptados = Array.from(document.querySelectorAll('[aria-label*="adoptado"]'));
    for (const arbol of adoptados) {
      expect((arbol as HTMLButtonElement).disabled).toBe(true);
    }
  });
});

describe('Tueste Tree adopción (ritual por etapas)', () => {
  it('seleccionar un árbol disponible abre el paso 02 (nombre)', async () => {
    const user = userEvent.setup();
    render(<AdoptarPage />);

    await user.click(screen.getByRole('button', { name: 'Seleccionar árbol 001 del Lote 000' }));

    expect(screen.getByLabelText('Nombre de tu árbol')).toBeInTheDocument();
    const continuar = screen.getByRole('button', { name: 'Continuar' });
    expect(continuar).toBeDisabled();

    await user.type(screen.getByLabelText('Nombre de tu árbol'), 'Aurora');
    expect(continuar).toBeEnabled();
  });

  it('nombrar y continuar abre el paso 03 con las cuatro insignias', async () => {
    const user = userEvent.setup();
    render(<AdoptarPage />);

    await user.click(screen.getByRole('button', { name: 'Seleccionar árbol 002 del Lote 000' }));
    await user.type(screen.getByLabelText('Nombre de tu árbol'), 'Aurora');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    for (const [nombre, rango] of [
      ['Semilla', '1 a 9 árboles'],
      ['Plata', '10 a 19 árboles'],
      ['Oro', '20 a 29 árboles'],
      ['Holográfica', '30 árboles o más'],
    ]) {
      expect(
        screen.getByRole('button', { name: `Insignia ${nombre}: ${rango}` }),
      ).toBeInTheDocument();
    }
    expect(screen.getAllByRole('button', { name: /^Insignia / })).toHaveLength(4);

    // La selección de insignia es local y no dispara navegación ni pago:
    // al elegirla, el ritual avanza al certificado sin salir de la página.
    const nivel = screen.getByRole('button', { name: 'Insignia Semilla: 1 a 9 árboles' });
    expect(nivel).toHaveAttribute('aria-pressed', 'false');
    await user.click(nivel);
    expect(screen.getByText('CERTIFICADO DE GUARDIÁN · VISTA PREVIA')).toBeInTheDocument();
  });

  it('al elegir insignia aparece el certificado local y la bitácora', async () => {
    const user = userEvent.setup();
    render(<AdoptarPage />);

    await user.click(screen.getByRole('button', { name: 'Seleccionar árbol 003 del Lote 000' }));
    await user.type(screen.getByLabelText('Nombre de tu árbol'), 'Aurora');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('button', { name: 'Insignia Plata: 10 a 19 árboles' }));

    expect(screen.getByText('CERTIFICADO DE GUARDIÁN · VISTA PREVIA')).toBeInTheDocument();
    expect(screen.getByText('Aurora')).toBeInTheDocument();
    expect(screen.getByText('Bitácora del ciclo')).toBeInTheDocument();
    expect(screen.getByText('Plata · 10 a 19 árboles')).toBeInTheDocument();
    expect(
      screen.getByText(/Se formaliza al comprarla en la tienda Tueste Co\./),
    ).toBeInTheDocument();
  });

  it('«Empezar de nuevo» limpia exclusivamente el estado local', async () => {
    const user = userEvent.setup();
    render(<AdoptarPage />);

    await user.click(screen.getByRole('button', { name: 'Seleccionar árbol 004 del Lote 000' }));
    await user.type(screen.getByLabelText('Nombre de tu árbol'), 'Aurora');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('button', { name: 'Insignia Semilla: 1 a 9 árboles' }));

    await user.click(screen.getByRole('button', { name: 'Empezar de nuevo' }));

    expect(screen.queryByText('CERTIFICADO DE GUARDIÁN · VISTA PREVIA')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Nombre de tu árbol')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Seleccionar árbol 001 del Lote 000' }),
    ).toBeInTheDocument();
  });
});

describe('Tueste Tree adopción (qué incluye y cierre)', () => {
  it('muestra qué incluye la adopción y el aviso de que no es una inversión', () => {
    render(<AdoptarPage />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Lo que incluye tu adopción.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Certificado numerado')).toBeInTheDocument();
    expect(screen.getByText(/^No es una inversión: compras por adelantado/)).toBeInTheDocument();

    const texto = document.body.textContent ?? '';
    for (const prohibido of [/equity/i, /inversionista/i, /cofund/i, /capital objetivo/i, /USD/]) {
      expect(texto).not.toMatch(prohibido);
    }
  });

  it('cierra con promesa, comunidad, territorio y actualizaciones', () => {
    render(<AdoptarPage />);

    expect(screen.getByText(/Prometemos menos\. Cumplimos siempre\./)).toBeInTheDocument();
    expect(screen.getByText(/Un santuario para el origen/)).toBeInTheDocument();
    expect(screen.getByText(/El origen se cuida también al nombrarlo/)).toBeInTheDocument();
    expect(screen.getByText('El ciclo sigue')).toBeInTheDocument();
  });

  it('no hay pagos, red, persistencia, mapas ni navegación externa', () => {
    render(<AdoptarPage />);

    const enlaces = Array.from(document.querySelectorAll('a')).map(
      (a) => a.getAttribute('href') ?? '',
    );
    expect(enlaces.every((h) => h.startsWith('/') || h.startsWith('#'))).toBe(true);
    expect(enlaces.some((h) => h.startsWith('http'))).toBe(false);

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
