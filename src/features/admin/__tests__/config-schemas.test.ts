import { describe, expect, it } from 'vitest';

import {
  ADMIN_SETTING_DEFINITIONS,
  ADMIN_SETTING_INPUT_SCHEMA,
  ADMIN_SETTING_KEYS,
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
});
