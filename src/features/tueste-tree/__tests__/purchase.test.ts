import { describe, expect, it } from 'vitest';
import {
  ADOPCION_TIENDA,
  MAX_ARBOLES_POR_COMPRA,
  adoptionRequestSchema,
  buildAdoptionCartUrl,
  createAdoptionReference,
  isAdoptionReference,
} from '../purchase';

const bytes = (value: number) => (size: number) => new Uint8Array(size).fill(value);

describe('referencia de adopción', () => {
  it('tiene prefijo TT- y 16 caracteres sin ambigüedad visual', () => {
    const reference = createAdoptionReference(bytes(0));
    expect(reference).toMatch(/^TT-[0-9A-HJKMNP-TV-Z]{16}$/);
    expect(isAdoptionReference(reference)).toBe(true);
  });

  it('cambia con la entropía recibida', () => {
    expect(createAdoptionReference(bytes(1))).not.toBe(createAdoptionReference(bytes(2)));
  });

  it('rechaza referencias con otra forma', () => {
    expect(isAdoptionReference('TT-123')).toBe(false);
    expect(isAdoptionReference('XX-0000000000000000')).toBe(false);
    expect(isAdoptionReference('TT-000000000000000I')).toBe(false);
    expect(isAdoptionReference(null)).toBe(false);
  });
});

describe('enlace de carrito de la tienda', () => {
  it('arma el carrito con la variante, la cantidad y la referencia', () => {
    const url = buildAdoptionCartUrl('https://tueste.co', 12, 'TT-0000000000000000');
    expect(url).toBe(
      `https://tueste.co/cart/${ADOPCION_TIENDA.variantId}:12?attributes%5Bref-experiencia%5D=TT-0000000000000000`,
    );
  });

  it('no duplica la barra si la tienda viene con barra final', () => {
    const url = buildAdoptionCartUrl('https://tueste.co/', 1, 'TT-0000000000000000');
    expect(url.startsWith(`https://tueste.co/cart/${ADOPCION_TIENDA.variantId}:1?`)).toBe(true);
  });

  it('se niega a armar un enlace con cantidad o referencia inválidas', () => {
    expect(() => buildAdoptionCartUrl('https://tueste.co', 0, 'TT-0000000000000000')).toThrow();
    expect(() => buildAdoptionCartUrl('https://tueste.co', 1.5, 'TT-0000000000000000')).toThrow();
    expect(() => buildAdoptionCartUrl('https://tueste.co', 1, 'cualquier cosa')).toThrow();
  });
});

describe('solicitud de adopción', () => {
  const valid = { treeId: 'arbol-001', treeName: '  Aurora  ', treesCount: '3' };

  it('acepta un árbol del cultivo, recorta el nombre y convierte la cantidad', () => {
    const parsed = adoptionRequestSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual({ treeId: 'arbol-001', treeName: 'Aurora', treesCount: 3 });
  });

  it('rechaza un árbol que no existe en el cultivo', () => {
    expect(adoptionRequestSchema.safeParse({ ...valid, treeId: 'arbol-999' }).success).toBe(false);
  });

  it('rechaza un árbol ya adoptado en el cultivo', () => {
    expect(adoptionRequestSchema.safeParse({ ...valid, treeId: 'arbol-007' }).success).toBe(false);
  });

  it('rechaza nombres vacíos o de más de 40 caracteres', () => {
    expect(adoptionRequestSchema.safeParse({ ...valid, treeName: '   ' }).success).toBe(false);
    expect(adoptionRequestSchema.safeParse({ ...valid, treeName: 'a'.repeat(41) }).success).toBe(
      false,
    );
  });

  it('rechaza cantidades no enteras, menores que 1 o por encima del tope', () => {
    for (const treesCount of ['0', '-1', '2.5', 'abc', String(MAX_ARBOLES_POR_COMPRA + 1)]) {
      expect(adoptionRequestSchema.safeParse({ ...valid, treesCount }).success).toBe(false);
    }
    expect(
      adoptionRequestSchema.safeParse({ ...valid, treesCount: String(MAX_ARBOLES_POR_COMPRA) })
        .success,
    ).toBe(true);
  });
});
