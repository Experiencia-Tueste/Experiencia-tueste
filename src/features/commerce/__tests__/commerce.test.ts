import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  addToCart,
  cartCount,
  cartTotal,
  changeQty,
  formatoCOP,
  getProduct,
  MAX_CART_QTY,
  PRODUCTS,
  sanitizeCart,
} from '../index';

describe('feature commerce', () => {
  it('expone el catálogo de la tienda', () => {
    expect(PRODUCTS).toHaveLength(6);
    expect(getProduct('cafe-lote-000')?.price).toBe(72000);
  });

  it('añade un producto al carrito (inmutable)', () => {
    const cart = addToCart([], 'cafe-lote-000');
    expect(cart).toEqual([{ productId: 'cafe-lote-000', qty: 1 }]);
    const cart2 = addToCart(cart, 'cafe-lote-000');
    expect(cart2).toEqual([{ productId: 'cafe-lote-000', qty: 2 }]);
    expect(cart).toEqual([{ productId: 'cafe-lote-000', qty: 1 }]);
  });

  it('cambia cantidades y elimina al llegar a 0', () => {
    const cart = addToCart(addToCart([], 'taza-cantara'), 'taza-cantara');
    expect(cartCount(cart)).toBe(2);
    const less = changeQty(cart, 'taza-cantara', -2);
    expect(less).toEqual([]);
  });

  it('centraliza y respeta el máximo de unidades por producto', () => {
    expect(MAX_CART_QTY).toBe(20);
    const cart = addToCart([], 'cafe-lote-000', 99);
    expect(cart).toEqual([{ productId: 'cafe-lote-000', qty: MAX_CART_QTY }]);
    expect(addToCart(cart, 'cafe-lote-000')).toEqual(cart);
    expect(changeQty(cart, 'cafe-lote-000', 1)).toEqual(cart);
  });

  it('recupera datos persistidos inválidos sin productos desconocidos ni duplicados', () => {
    expect(
      sanitizeCart([
        { productId: 'cafe-lote-000', qty: 2 },
        { productId: 'cafe-lote-000', qty: 3 },
        { productId: 'no-existe', qty: 4 },
        { productId: 'taza-cantara', qty: 0 },
        { productId: 'field-tapes', qty: 1.5 },
        null,
      ]),
    ).toEqual([{ productId: 'cafe-lote-000', qty: 5 }]);
  });

  it('calcula totales solo con productos conocidos', () => {
    const cart = addToCart([], 'cafe-lote-000');
    expect(cartTotal(cart)).toBe(72000);
    expect(cartCount(cart)).toBe(1);
  });

  it('formatea montos en COP con separadores es-CO', () => {
    expect(formatoCOP(185000)).toContain('185.000');
    expect(formatoCOP(72000)).toContain('72.000');
    expect(formatoCOP(0)).toContain('0');
  });

  it('los seis productos usan las rutas exactas de assets locales existentes', () => {
    const esperado: Record<string, string> = {
      'coffee-in-frequencies': '/images/store/vinilo-coffee-in-frequencies.webp',
      'field-tapes': '/images/store/cassette-field-tapes.webp',
      'taza-cantara': '/images/store/taza-cantara.webp',
      'camiseta-origen': '/images/store/camiseta-origen.webp',
      'print-espectrograma': '/images/store/print-espectrograma.webp',
      'cafe-lote-000': '/images/store/cafe-lote-000.webp',
    };

    for (const product of PRODUCTS) {
      expect(product.imageSrc).toBe(esperado[product.id]);
      expect(product.imageSrc).toMatch(/^\/images\/store\//);
      expect(product.imageSrc).not.toMatch(/^https?:\/\//);
      expect(product.imageSrc).not.toMatch(/^data:/);
      expect(
        existsSync(join(process.cwd(), 'public', product.imageSrc as string)),
        `asset local faltante: ${product.imageSrc}`,
      ).toBe(true);
    }
  });
});
