import { describe, expect, it } from 'vitest';

import {
  ADMIN_SETTING_DEFINITIONS,
  ADMIN_SETTING_INPUT_SCHEMA,
  ADMIN_SETTING_KEYS,
  ADMIN_INTEGRATION_INPUT_SCHEMA,
  COUPON_REFERENCE_INPUT_SCHEMA,
} from '../config-schemas';

describe('configuración administrativa', () => {
  it('mantiene una definición visible por cada clave persistible', () => {
    expect(ADMIN_SETTING_DEFINITIONS.map((definition) => definition.key)).toEqual(
      ADMIN_SETTING_KEYS,
    );
  });

  it('acepta valores públicos válidos con razón auditable', () => {
    expect(
      ADMIN_SETTING_INPUT_SCHEMA.parse({
        key: 'integrations.shopify_store_url',
        value: 'https://tueste.myshopify.com',
        reason: 'Conectar la tienda pública',
      }),
    ).toMatchObject({ key: 'integrations.shopify_store_url' });
  });

  it('rechaza URLs inseguras y correos inválidos', () => {
    expect(() =>
      ADMIN_SETTING_INPUT_SCHEMA.parse({
        key: 'integrations.shopify_store_url',
        value: 'http://tienda.test',
        reason: 'Prueba insegura',
      }),
    ).toThrow();
    expect(() =>
      ADMIN_SETTING_INPUT_SCHEMA.parse({
        key: 'contact.support_email',
        value: 'correo-invalido',
        reason: 'Actualizar soporte',
      }),
    ).toThrow();
  });

  it('exige nombre público y razón explícita', () => {
    expect(() =>
      ADMIN_SETTING_INPUT_SCHEMA.parse({
        key: 'brand.display_name',
        value: '',
        reason: 'Cambio',
      }),
    ).toThrow();
    expect(() =>
      ADMIN_SETTING_INPUT_SCHEMA.parse({
        key: 'brand.tagline',
        value: 'Origen',
        reason: '',
      }),
    ).toThrow();
  });

  it('valida referencias públicas de integraciones y cupones', () => {
    expect(
      ADMIN_INTEGRATION_INPUT_SCHEMA.parse({
        provider: 'shopify',
        label: 'Shopify',
        status: 'configured',
        publicReference: 'tueste.myshopify.com',
        reason: 'Registrar estado operativo',
      }).provider,
    ).toBe('shopify');
    expect(
      COUPON_REFERENCE_INPUT_SCHEMA.parse({
        code: 'bienvenida-10',
        label: 'Bienvenida',
        status: 'active',
        reason: 'Referencia comercial aprobada',
      }).code,
    ).toBe('BIENVENIDA-10');
  });

  it('rechaza proveedores y cupones con caracteres no permitidos', () => {
    expect(() =>
      ADMIN_INTEGRATION_INPUT_SCHEMA.parse({
        provider: 'Shopify URL',
        label: 'Shopify',
        status: 'configured',
        reason: 'Prueba inválida',
      }),
    ).toThrow();
    expect(() =>
      COUPON_REFERENCE_INPUT_SCHEMA.parse({
        code: 'CUPON CON ESPACIOS',
        label: 'Cupón',
        status: 'active',
        reason: 'Prueba inválida',
      }),
    ).toThrow();
  });
});
