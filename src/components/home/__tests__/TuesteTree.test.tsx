import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LOTE_FUNDADOR } from '@/features/adoption';
import TuesteTree from '../TuesteTree';

const LOTE_VISUAL = readFileSync(resolve(__dirname, '../LoteVisual.tsx'), 'utf-8');

describe('TuesteTree (fotografía editorial del lote)', () => {
  it('la foto local del cafetal existe en public/images/tueste-tree', () => {
    expect(
      existsSync(
        resolve(__dirname, '../../../../public/images/tueste-tree/lote-000-cafetal-v1.png'),
      ),
    ).toBe(true);
  });

  it('usa next/image con la ruta local, alt vacío y fill', () => {
    const { container } = render(<TuesteTree />);

    const img = container.querySelector('img[src*="lote-000-cafetal-v1.png"]');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('alt', '');
    // next/image con fill no expone width/height en atributos; el src
    // se codifica en el loader.
    expect(img!.getAttribute('src')).toContain('lote-000-cafetal-v1.png');
  });

  it('la foto es decorativa (wrapper aria-hidden) y no duplica contenido', () => {
    const { container } = render(<TuesteTree />);

    const img = container.querySelector('img[src*="lote-000-cafetal-v1.png"]');
    expect(img).not.toBeNull();
    expect(img!.closest('[aria-hidden="true"]')).not.toBeNull();
    // La etiqueta y coordenadas viven FUERA del wrapper decorativo.
    const tag = img!
      .closest('[aria-hidden="true"]')!
      .parentElement!.querySelector('[class*="vtag"]');
    expect(tag).not.toBeNull();
  });

  it('conserva la etiqueta del lote y las coordenadas del fundador', () => {
    render(<TuesteTree />);

    expect(screen.getByText(LOTE_FUNDADOR.nombre)).toBeInTheDocument();
    expect(
      screen.getByText(
        `${LOTE_FUNDADOR.coordenadas} · ${LOTE_FUNDADOR.ubicacion} · ${LOTE_FUNDADOR.altitud}`,
      ),
    ).toBeInTheDocument();
  });

  it('no elimina la interacción: activar árbol y ver el panel demo', async () => {
    const user = userEvent.setup();
    render(<TuesteTree />);

    await user.click(screen.getByRole('button', { name: /Activar mi árbol/ }));
    expect(screen.getByRole('heading', { name: 'Activa tu árbol' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Volver/ }));
    await user.click(screen.getByRole('button', { name: /Ver el panel del adoptante/ }));
    expect(screen.getByText(/Estado de tu árbol/)).toBeInTheDocument();
  });

  it('el árbol de seguimiento se renderiza en el panel del adoptante', async () => {
    const user = userEvent.setup();
    const { container } = render(<TuesteTree />);

    await user.click(screen.getByRole('button', { name: /Ver el panel del adoptante/ }));
    expect(screen.getByText(/Estado de tu árbol/)).toBeInTheDocument();

    // Arbol es un SVG decorativo con el tronco del árbol.
    const arboles = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(arboles.length).toBeGreaterThanOrEqual(1);
  });

  it('LotePaisaje ya no existe y Arbol sigue en LoteVisual', () => {
    expect(LOTE_VISUAL).not.toContain('LotePaisaje');
    expect(LOTE_VISUAL).toContain('export function Arbol');
  });

  it('sin Canvas, audio ni APIs de navegador en el visual', () => {
    const { container } = render(<TuesteTree />);
    expect(container.querySelector('canvas')).toBeNull();
    expect(container.querySelector('audio')).toBeNull();
  });
});
