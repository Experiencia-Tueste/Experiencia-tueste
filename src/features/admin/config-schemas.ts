import { z } from 'zod';

export const ADMIN_SETTING_KEYS = [
  'brand.display_name',
  'brand.tagline',
  'contact.support_email',
  'contact.sales_email',
  'commerce.default_coupon_reference',
  'integrations.shopify_store_url',
] as const;

export type AdminSettingKey = (typeof ADMIN_SETTING_KEYS)[number];

export type AdminSettingDefinition = {
  key: AdminSettingKey;
  group: 'Marca' | 'Contacto' | 'Comercio' | 'Integraciones';
  label: string;
  description: string;
  type: 'text' | 'email' | 'url';
  placeholder: string;
};

export const ADMIN_SETTING_DEFINITIONS: readonly AdminSettingDefinition[] = [
  {
    key: 'brand.display_name',
    group: 'Marca',
    label: 'Nombre público',
    description: 'Nombre visible de la marca en comunicaciones y superficies futuras.',
    type: 'text',
    placeholder: 'Tueste',
  },
  {
    key: 'brand.tagline',
    group: 'Marca',
    label: 'Descripción corta',
    description: 'Frase breve para piezas editoriales y metadatos.',
    type: 'text',
    placeholder: 'El café también se escucha.',
  },
  {
    key: 'contact.support_email',
    group: 'Contacto',
    label: 'Correo de soporte',
    description: 'Canal público para ayuda de clientes.',
    type: 'email',
    placeholder: 'soporte@tueste.co',
  },
  {
    key: 'contact.sales_email',
    group: 'Contacto',
    label: 'Correo comercial',
    description: 'Canal público para alianzas y ventas B2B.',
    type: 'email',
    placeholder: 'comercial@tueste.co',
  },
  {
    key: 'commerce.default_coupon_reference',
    group: 'Comercio',
    label: 'Referencia de cupón',
    description: 'Código de referencia visible; no almacena credenciales de pagos.',
    type: 'text',
    placeholder: 'BIENVENIDA-TUESTE',
  },
  {
    key: 'integrations.shopify_store_url',
    group: 'Integraciones',
    label: 'URL pública de Shopify',
    description: 'Destino público de la tienda. Los tokens permanecen en Railway.',
    type: 'url',
    placeholder: 'https://tueste.myshopify.com',
  },
];

const baseSettingInput = z.object({
  key: z.enum(ADMIN_SETTING_KEYS),
  value: z.string().trim().max(500),
  reason: z.string().trim().min(3).max(300),
});

export const ADMIN_SETTING_INPUT_SCHEMA = baseSettingInput.superRefine((input, context) => {
  if (input.key === 'brand.display_name' && input.value.length === 0) {
    context.addIssue({
      code: 'custom',
      path: ['value'],
      message: 'El nombre público es obligatorio.',
    });
  }

  if (input.key.startsWith('contact.') && input.value.length > 0) {
    const parsed = z.string().email().safeParse(input.value);
    if (!parsed.success) {
      context.addIssue({ code: 'custom', path: ['value'], message: 'El correo no es válido.' });
    }
  }

  if (input.key === 'integrations.shopify_store_url' && input.value.length > 0) {
    const parsed = z.string().url().startsWith('https://').safeParse(input.value);
    if (!parsed.success) {
      context.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'La URL de Shopify debe ser una URL HTTPS válida.',
      });
    }
  }
});

export type AdminSettingInput = z.infer<typeof ADMIN_SETTING_INPUT_SCHEMA>;
