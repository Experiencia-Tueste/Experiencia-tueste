import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ADOPCION_TIENDA } from '../purchase';
import { parsePaidOrder, parseRefund, verifyShopifyHmac } from '../shopify-webhook';

const SECRET = 'secreto-de-prueba';
const sign = (body: string, secret = SECRET) =>
  createHmac('sha256', secret).update(body, 'utf8').digest('base64');
const VARIANT = Number(ADOPCION_TIENDA.variantId);

describe('firma del aviso de Shopify', () => {
  const body = '{"id":1,"nombre":"café"}';

  it('acepta la firma calculada con el secreto sobre el cuerpo crudo', () => {
    expect(verifyShopifyHmac(body, sign(body), SECRET)).toBe(true);
  });

  it('rechaza si el cuerpo cambió, aunque sea un espacio', () => {
    expect(verifyShopifyHmac(`${body} `, sign(body), SECRET)).toBe(false);
  });

  it('rechaza una firma hecha con otro secreto', () => {
    expect(verifyShopifyHmac(body, sign(body, 'otro'), SECRET)).toBe(false);
  });

  it('rechaza firmas ausentes, vacías o que no son base64 de 32 bytes', () => {
    expect(verifyShopifyHmac(body, null, SECRET)).toBe(false);
    expect(verifyShopifyHmac(body, '', SECRET)).toBe(false);
    expect(verifyShopifyHmac(body, 'abc', SECRET)).toBe(false);
    expect(verifyShopifyHmac(body, 'no es base64 !!', SECRET)).toBe(false);
  });

  it('rechaza siempre si no hay secreto configurado', () => {
    expect(verifyShopifyHmac(body, sign(body, ''), '')).toBe(false);
  });
});

describe('pedido pagado', () => {
  const order = (extra: object = {}) =>
    JSON.stringify({
      id: 5123456789012,
      admin_graphql_api_id: 'gid://shopify/Order/5123456789012',
      note_attributes: [
        { name: 'otra-cosa', value: 'x' },
        { name: 'ref-experiencia', value: 'TT-0123456789ABCDEF' },
      ],
      line_items: [
        { variant_id: VARIANT, quantity: 10 },
        { variant_id: 999, quantity: 3 },
        { variant_id: VARIANT, quantity: 2 },
      ],
      ...extra,
    });

  it('lee el pedido, la referencia y suma solo los árboles de la adopción', () => {
    expect(parsePaidOrder(order())).toEqual({
      orderId: '5123456789012',
      reference: 'TT-0123456789ABCDEF',
      trees: 12,
    });
  });

  it('conserva identificadores de pedido más grandes que un entero seguro', () => {
    const big = order({ admin_graphql_api_id: 'gid://shopify/Order/820982911946154508' });
    expect(parsePaidOrder(big)?.orderId).toBe('820982911946154508');
  });

  it('sin referencia válida devuelve referencia nula', () => {
    expect(parsePaidOrder(order({ note_attributes: [] }))?.reference).toBeNull();
    expect(
      parsePaidOrder(order({ note_attributes: [{ name: 'ref-experiencia', value: 'hola' }] }))
        ?.reference,
    ).toBeNull();
    expect(parsePaidOrder(order({ note_attributes: undefined }))?.reference).toBeNull();
  });

  it('un pedido sin el producto de adopción tiene cero árboles', () => {
    expect(parsePaidOrder(order({ line_items: [{ variant_id: 999, quantity: 3 }] }))?.trees).toBe(
      0,
    );
  });

  it('ignora cantidades que no son enteros positivos', () => {
    const raw = order({
      line_items: [
        { variant_id: VARIANT, quantity: -4 },
        { variant_id: VARIANT, quantity: 1.5 },
        { variant_id: VARIANT, quantity: 3 },
      ],
    });
    expect(parsePaidOrder(raw)?.trees).toBe(3);
  });

  it('devuelve null si el cuerpo no es JSON o no trae el pedido', () => {
    expect(parsePaidOrder('no es json')).toBeNull();
    expect(parsePaidOrder('{}')).toBeNull();
    expect(parsePaidOrder('[]')).toBeNull();
    expect(parsePaidOrder(order({ admin_graphql_api_id: 'gid://shopify/Product/1' }))).toBeNull();
  });
});

describe('reembolso', () => {
  const refund = (lines: object[] | undefined, head = '"id":900,"order_id":5123456789012') =>
    `{${head},"refund_line_items":${JSON.stringify(lines)}}`;

  it('lee el pedido y suma solo los árboles reembolsados de la adopción', () => {
    const raw = refund([
      { quantity: 2, line_item: { variant_id: VARIANT } },
      { quantity: 5, line_item: { variant_id: 999 } },
      { quantity: 1, line_item: { variant_id: VARIANT } },
    ]);
    expect(parseRefund(raw)).toEqual({ orderId: '5123456789012', trees: 3 });
  });

  it('conserva identificadores de pedido más grandes que un entero seguro', () => {
    const raw = refund(
      [{ quantity: 1, line_item: { variant_id: VARIANT } }],
      '"id":890088186047892319,"order_id": 820982911946154508',
    );
    expect(parseRefund(raw)?.orderId).toBe('820982911946154508');
  });

  it('un reembolso sin líneas de la adopción tiene cero árboles', () => {
    expect(parseRefund(refund([]))?.trees).toBe(0);
    expect(parseRefund(refund([{ quantity: 1, line_item: { variant_id: null } }]))?.trees).toBe(0);
  });

  it('devuelve null si el cuerpo no es JSON o no trae el pedido', () => {
    expect(parseRefund('no es json')).toBeNull();
    expect(parseRefund('{"id":900}')).toBeNull();
  });
});
