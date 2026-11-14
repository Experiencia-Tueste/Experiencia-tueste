import 'server-only';

import { getCurrentAdmin } from '@/lib/auth/authorization';
import {
  buildVendorImageStorageKey,
  createAdminStorageProvider,
} from '@/integrations/storage/supabase-storage';
import {
  VENDOR_IMAGE_UPLOAD_REQUEST_SCHEMA,
  expectedMarketImageContentType,
} from './operations-schemas';
import type { CurrentAdmin } from './authorization-core';

/**
 * Exige sesión de vendedor (`market.self` + `vendorId` vinculado). El
 * `vendorId` sale siempre de esta sesión, nunca de un parámetro que
 * pudiera venir de un formulario o de otro admin.
 */
async function requireVendorScope(): Promise<CurrentAdmin & { vendorId: string }> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('401: sesión administrativa requerida.');
  if (!admin.capabilities.includes('market.self')) {
    throw new Error('403: se requiere la capacidad market.self.');
  }
  if (!admin.vendorId) throw new Error('403: no hay un vendedor vinculado a esta cuenta.');
  return { ...admin, vendorId: admin.vendorId };
}

/**
 * Crea una URL firmada de subida para la imagen de un listing propio,
 * scopeada a `vendors/{vendorId}/…`. Análogo a `createSignedAssetUpload`
 * (admin-assets), pero el prefijo nunca es negociable desde el cliente:
 * `vendorId` sale de la sesión del vendedor autenticado.
 */
export async function createVendorImageSignedUpload(input: unknown) {
  const admin = await requireVendorScope();
  const parsed = VENDOR_IMAGE_UPLOAD_REQUEST_SCHEMA.parse(input);
  const provider = createAdminStorageProvider();
  if (!provider) {
    throw new Error('503: Storage no está configurado para el panel.');
  }
  const key = buildVendorImageStorageKey(admin.vendorId, parsed.filename);
  const signed = await provider.createSignedUpload({ key });
  return {
    ...signed,
    imagePath: key,
    filename: parsed.filename,
    mimeType: parsed.mimeType,
    sizeBytes: parsed.sizeBytes,
  };
}

/**
 * Verifica contra Storage — nunca contra `imageSizeBytes`/`imagePath` como
 * input del cliente — que la imagen declarada de un listing existe de
 * verdad y que su tamaño y content-type reales coinciden con lo
 * declarado. Se llama antes de dejar pasar un listing a `review` o
 * `published`; si no hay imagen declarada (opcional), no hay nada que
 * verificar.
 */
export async function assertMarketListingImageStored(current: {
  imagePath: string | null;
  imageSizeBytes: number;
}): Promise<void> {
  if (!current.imagePath) return;

  const provider = createAdminStorageProvider();
  if (!provider) {
    throw new Error('503: Storage no está disponible para verificar la imagen.');
  }

  const metadata = await provider.getObjectMetadata(current.imagePath);
  if (!metadata) {
    throw new Error('400: la imagen declarada no existe en Storage.');
  }
  if (metadata.size !== current.imageSizeBytes) {
    throw new Error('400: el tamaño real de la imagen no coincide con el declarado.');
  }
  const expectedContentType = expectedMarketImageContentType(current.imagePath);
  if (!expectedContentType || metadata.contentType !== expectedContentType) {
    throw new Error(
      '400: el tipo de archivo real de la imagen no coincide con la extensión declarada.',
    );
  }
}
