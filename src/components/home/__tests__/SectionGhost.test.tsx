import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SectionGhost from '../SectionGhost';

describe('SectionGhost (número fantasma de sección)', () => {
  it('renderiza el número con data-section-ghost y aria-hidden', () => {
    const { container } = render(<SectionGhost number="01" />);

    const ghost = container.querySelector('[data-section-ghost]');
    expect(ghost).not.toBeNull();
    expect(ghost).toHaveAttribute('data-section-ghost', '01');
    expect(ghost).toHaveAttribute('aria-hidden', 'true');
    expect(ghost!.textContent).toBe('01');
  });

  it('alinea a la derecha por defecto (end) y a la izquierda con side="start"', () => {
    const { container, rerender } = render(<SectionGhost number="02" />);
    expect(container.querySelector('[data-section-ghost]')!.className).toContain('end');

    rerender(<SectionGhost number="10" side="start" />);
    expect(container.querySelector('[data-section-ghost]')!.className).toContain('start');
  });
});
