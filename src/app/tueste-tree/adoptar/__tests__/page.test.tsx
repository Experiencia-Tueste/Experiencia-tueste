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
    expect(metadata.description).toContain('Lote 000 Founders');
  });

  it('presenta el hero con el eyebrow del Drop abierto y el título exacto', () => {
    render(<AdoptarPage />);

    expect(screen.getByText('DROP ABIERTO · 10.200 ÁRBOLES')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Adopta un árbol. Cofunda un origen.' }),
    ).toBeInTheDocument();
  });

  it('tiene los dos CTA: «Elegir mi árbol» → #cultivo y «Ver niveles» → #modelo', () => {
    render(<AdoptarPage />);

    expect(screen.getByRole('link', { name: /Elegir mi árbol/ })).toHaveAttribute(
      'href',
      '#cultivo',
    );
    expect(screen.getByRole('link', { name: /Ver niveles/ })).toHaveAttribute('href', '#modelo');
  });

  it('muestra las tres métricas editoriales', () => {
    render(<AdoptarPage />);

    expect(screen.getAllByText('Árboles fundacionales').length).toBeGreaterThan(0);
    expect(screen.getAllByText('10.200').length).toBeGreaterThan(0);
    expect(screen.getByText('Desde')).toBeInTheDocument();
    expect(screen.getByText('USD 100')).toBeInTheDocument();
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
    expect(screen.queryByRole('button', { name: /Nivel de cofundación/ })).not.toBeInTheDocument();
    expect(screen.queryByText('CERTIFICADO DE SOCIO FUNDADOR')).not.toBeInTheDocument();
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

  it('nombrar y continuar abre el paso 03 con las seis filas de niveles', async () => {
    const user = userEvent.setup();
    render(<AdoptarPage />);

    await user.click(screen.getByRole('button', { name: 'Seleccionar árbol 002 del Lote 000' }));
    await user.type(screen.getByLabelText('Nombre de tu árbol'), 'Aurora');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    for (const nombre of [
      'Entrada simbólica',
      'Inversionista pequeño',
      'Inversionista medio',
      'Inversionista estratégico',
      'Inversionista mayorista',
      'Inversionista ancla',
    ]) {
      expect(
        screen.getByRole('button', { name: new RegExp(`Nivel de cofundación .*: ${nombre}`) }),
      ).toBeInTheDocument();
    }

    // La selección de nivel es local y no dispara navegación ni pago:
    // al elegirlo, el ritual avanza al certificado sin salir de la página.
    const nivel = screen.getByRole('button', {
      name: /Nivel de cofundación Nivel 01: Entrada simbólica/,
    });
    expect(nivel).toHaveAttribute('aria-pressed', 'false');
    await user.click(nivel);
    expect(screen.getByText('CERTIFICADO DE SOCIO FUNDADOR')).toBeInTheDocument();
  });

  it('al elegir nivel aparece el certificado local y la bitácora', async () => {
    const user = userEvent.setup();
    render(<AdoptarPage />);

    await user.click(screen.getByRole('button', { name: 'Seleccionar árbol 003 del Lote 000' }));
    await user.type(screen.getByLabelText('Nombre de tu árbol'), 'Aurora');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(
      screen.getByRole('button', { name: /Nivel de cofundación Nivel 02: Inversionista pequeño/ }),
    );

    expect(screen.getByText('CERTIFICADO DE SOCIO FUNDADOR')).toBeInTheDocument();
    expect(screen.getByText('Aurora')).toBeInTheDocument();
    expect(screen.getByText('Bitácora del ciclo')).toBeInTheDocument();
    expect(screen.getByText(/Tu selección es una intención de adopción\./)).toBeInTheDocument();
  });

  it('«Empezar de nuevo» limpia exclusivamente el estado local', async () => {
    const user = userEvent.setup();
    render(<AdoptarPage />);

    await user.click(screen.getByRole('button', { name: 'Seleccionar árbol 004 del Lote 000' }));
    await user.type(screen.getByLabelText('Nombre de tu árbol'), 'Aurora');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(
      screen.getByRole('button', { name: /Nivel de cofundación Nivel 01: Entrada simbólica/ }),
    );

    await user.click(screen.getByRole('button', { name: 'Empezar de nuevo' }));

    expect(screen.queryByText('CERTIFICADO DE SOCIO FUNDADOR')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Nombre de tu árbol')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Seleccionar árbol 001 del Lote 000' }),
    ).toBeInTheDocument();
  });
});

describe('Tueste Tree adopción (modelo fundacional y cierre)', () => {
  it('muestra el modelo fundacional informativo y el aviso legal preciso', () => {
    render(<AdoptarPage />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Los primeros 10.200 árboles.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('USD 1.020.000')).toBeInTheDocument();
    expect(screen.getByText(/30%/)).toBeInTheDocument();
    expect(
      screen.getByText(
        'Cifras indicativas sujetas a estructuración legal. Este contenido es informativo y no constituye una oferta pública de valores.',
      ),
    ).toBeInTheDocument();
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
