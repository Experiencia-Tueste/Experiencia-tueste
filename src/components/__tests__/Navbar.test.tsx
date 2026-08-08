import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Navbar from '../home/Navbar';
import SkipLink from '../SkipLink';

/**
 * Composición real del shell de la página: SkipLink + Navbar +
 * `#contenido-principal` (con `<main id="contenido">`), como en
 * `src/app/page.tsx`. Verifica el aislamiento del menú móvil modal.
 */
function renderShell() {
  return render(
    <>
      <SkipLink />
      <Navbar />
      <div id="contenido-principal">
        <main id="contenido" tabIndex={-1}>
          <h1>Contenido principal</h1>
        </main>
      </div>
    </>,
  );
}

describe('Navbar (menú móvil accesible)', () => {
  it('al abrir el menú: diálogo modal, inert en contenido y skip-link, foco al primer enlace', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));

    const dialog = screen.getByRole('dialog', { name: 'Menú de navegación' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    expect(document.getElementById('contenido-principal')).toHaveAttribute('inert');
    expect(document.getElementById('skip-link')).toHaveAttribute('inert');

    const firstLink = dialog.querySelector('a');
    expect(firstLink).not.toBeNull();
    expect(firstLink).toHaveFocus();
  });

  it('Escape cierra el menú, quita inert y devuelve el foco al botón hamburguesa', async () => {
    const user = userEvent.setup();
    renderShell();

    const burger = screen.getByRole('button', { name: 'Abrir menú' });
    await user.click(burger);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.getElementById('contenido-principal')).not.toHaveAttribute('inert');
    expect(document.getElementById('skip-link')).not.toHaveAttribute('inert');
    expect(burger).toHaveFocus();
  });
});
