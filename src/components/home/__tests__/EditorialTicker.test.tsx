import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EditorialTicker, { TICKER_TEXT } from '../EditorialTicker';

describe('EditorialTicker (cinta editorial)', () => {
  it('renderiza dos copias del texto; la segunda es aria-hidden', () => {
    const { container } = render(<EditorialTicker />);

    const copias = container.querySelectorAll('[data-copy]');
    expect(copias).toHaveLength(2);
    expect(copias[0].textContent).toBe(TICKER_TEXT);
    expect(copias[1].textContent).toBe(TICKER_TEXT);
    expect(copias[1]).toHaveAttribute('aria-hidden', 'true');
    expect(copias[0]).not.toHaveAttribute('aria-hidden');
  });

  it('usa la variante ámbar por defecto y la tenue con variant="dim"', () => {
    const { container, rerender } = render(<EditorialTicker />);
    expect(container.querySelector('[data-variant]')).toHaveAttribute('data-variant', 'amber');

    rerender(<EditorialTicker variant="dim" />);
    expect(container.querySelector('[data-variant]')).toHaveAttribute('data-variant', 'dim');
  });

  it('expone reverse y alt como atributos de datos para las variantes del master', () => {
    const { container, rerender } = render(<EditorialTicker reverse alt />);
    const ticker = container.querySelector('[data-variant]')!;
    expect(ticker).toHaveAttribute('data-reverse', 'true');
    expect(ticker).toHaveAttribute('data-alt', 'true');

    rerender(<EditorialTicker />);
    expect(container.querySelector('[data-variant]')!.hasAttribute('data-reverse')).toBe(false);
    expect(container.querySelector('[data-variant]')!.hasAttribute('data-alt')).toBe(false);
  });
});
