import 'server-only';

import { z } from 'zod';

import type { PublicEnv } from './env-public';

/**
 * Contrato de configuración SERVER-ONLY (src/lib/config/env-server).
 * ---------------------------------------------------------------------
 * Módulo protegido con `import 'server-only'`: si un componente cliente
 * intenta importarlo, el build falla con un error claro. Aquí viven las
 * variables que, sin ser secretas, solo se consumen desde el servidor.
 *
 * Ninguna de estas variables viaja al navegador ni se serializa como
 * prop de un componente cliente.
 */

const SITE_URL_SCHEMA = z.string().url();
const SHOPIFY_URL_SCHEMA = z
  .string()
  .url()
  .refine((value) => value.startsWith('https://'), {
    message: 'la URL debe usar https://',
  });

/**
 * URL canónica del sitio (server-only por uso: solo la consume el
 * Server Component del layout para `metadataBase`).
 *
 * Lee únicamente `SITE_URL` (no es secreto; sirve para canonical URL,
 * Open Graph y Twitter). Si está ausente o vacía, usa
 * `http://localhost:3000` exclusivamente como fallback local de
 * desarrollo/build. Si está presente pero no es una URL absoluta
 * válida, lanza un error claro.
 *
 * Antes de producción se configura `SITE_URL` con el dominio público
 * HTTPS real (p. ej. en AWS Route 53); no se hardcodea ningún dominio.
 */
export function loadSiteUrl(env: PublicEnv = process.env): string {
  const raw = env.SITE_URL;

  if (typeof raw !== 'string' || raw.trim() === '') {
    return 'http://localhost:3000';
  }

  const parsed = SITE_URL_SCHEMA.safeParse(raw.trim());
  if (!parsed.success) {
    throw new Error(
      `SITE_URL no es una URL absoluta válida: «${raw}». Usa el dominio público HTTPS real (p. ej. https://tueste.co) o deja la variable vacía para el fallback local.`,
    );
  }

  return parsed.data;
}

/**
 * URL pública de la tienda Tueste Co (Shopify) para el portal de entrada.
 *
 * Lee únicamente `SHOPIFY_STORE_URL` (no es secreto; es el enlace
 * público de la tienda). Si está ausente o vacía devuelve `null`: la
 * tarjeta Tienda muestra «Tienda próximamente» en lugar de un enlace
 * roto. Si está presente, debe ser una URL absoluta `https://`; en caso
 * contrario lanza un error claro que menciona `SHOPIFY_STORE_URL`.
 */
export function loadShopifyStoreUrl(env: PublicEnv = process.env): string | null {
  const raw = env.SHOPIFY_STORE_URL;

  if (typeof raw !== 'string' || raw.trim() === '') {
    return null;
  }

  const parsed = SHOPIFY_URL_SCHEMA.safeParse(raw.trim());
  if (!parsed.success) {
    throw new Error(
      `SHOPIFY_STORE_URL no es una URL absoluta https:// válida: «${raw}». Define la URL pública de la tienda (p. ej. https://tueste.myshopify.com) o deja la variable vacía para mostrar «Tienda próximamente».`,
    );
  }

  return parsed.data;
}
