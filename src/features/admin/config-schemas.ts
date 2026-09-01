import { z } from 'zod';

export const ADMIN_SETTING_KEYS = [
  'brand.display_name',
  'brand.tagline',
  'brand.website_url',
  'organization.legal_name',
  'organization.tax_id',
  'contact.support_email',
  'contact.sales_email',
  'contact.whatsapp',
  'commerce.default_coupon_reference',
  'integrations.shopify_store_url',
] as const;

export type AdminSettingKey = (typeof ADMIN_SETTING_KEYS)[number];

export type AdminSettingDefinition = {
  key: AdminSettingKey;
  group: 'Marca' | 'Organización' | 'Contacto' | 'Comercio' | 'Integraciones';
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
    key: 'brand.website_url',
    group: 'Marca',
    label: 'Sitio público',
    description: 'URL canónica de la experiencia Tueste.',
    type: 'url',
    placeholder: 'https://tueste.co',
  },
  {
    key: 'organization.legal_name',
    group: 'Organización',
    label: 'Razón social',
    description: 'Nombre legal usado como referencia administrativa.',
    type: 'text',
    placeholder: 'Tueste S.A.S.',
  },
  {
    key: 'organization.tax_id',
    group: 'Organización',
    label: 'Identificación fiscal',
    description: 'NIT o identificador fiscal público de la organización.',
    type: 'text',
    placeholder: '900.000.000-0',
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
    key: 'contact.whatsapp',
    group: 'Contacto',
    label: 'WhatsApp',
    description: 'Número público en formato internacional.',
    type: 'text',
    placeholder: '+57 300 000 0000',
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

  if (
    (input.key === 'contact.support_email' || input.key === 'contact.sales_email') &&
    input.value.length > 0
  ) {
    const parsed = z.string().email().safeParse(input.value);
    if (!parsed.success) {
      context.addIssue({ code: 'custom', path: ['value'], message: 'El correo no es válido.' });
    }
  }

  if (
    (input.key === 'integrations.shopify_store_url' || input.key === 'brand.website_url') &&
    input.value.length > 0
  ) {
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

export const ADMIN_INTEGRATION_INPUT_SCHEMA = z.object({
  provider: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]+$/)
    .max(60),
  label: z.string().trim().min(2).max(100),
  status: z.enum(['disconnected', 'configured', 'degraded', 'disabled']),
  publicReference: z.string().trim().max(500).optional(),
  reason: z.string().trim().min(3).max(300),
});

export const COUPON_REFERENCE_INPUT_SCHEMA = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]+$/)
    .max(80),
  label: z.string().trim().min(2).max(120),
  externalId: z.string().trim().max(160).optional(),
  status: z.enum(['active', 'inactive', 'expired']),
  reason: z.string().trim().min(3).max(300),
});

export type AdminSettingInput = z.infer<typeof ADMIN_SETTING_INPUT_SCHEMA>;
