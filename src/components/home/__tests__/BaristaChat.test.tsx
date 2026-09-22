import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import BaristaChat from '../BaristaChat';

describe('BaristaChat (interpretación de texto libre)', () => {
  it('interpreta una intención escrita y muestra una recomendación', async () => {
    const user = userEvent.setup();
    render(<BaristaChat onPlay={vi.fn()} onPlayQueue={vi.fn()} />);

    const input = screen.getByRole('textbox', { name: 'Escríbele al barista' });
    await user.type(input, 'Quiero algo dulce y rápido para concentrarme');
    await user.keyboard('{Enter}');

    expect(screen.getAllByText(/Entendí intención: enfoque/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Hoy tu café es/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preparar guiado' })).toBeInTheDocument();
  });
});
