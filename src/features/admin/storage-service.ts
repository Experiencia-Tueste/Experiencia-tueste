import 'server-only';

import { createAdminStorageProvider } from '@/integrations/storage/supabase-storage';
import { buildAssetStorageKey } from '@/integrations/storage/supabase-storage';
import { getStorageStatus } from './storage-contract';
import type { StorageStatus } from './storage-contract';
import { ASSET_UPLOAD_REQUEST_SCHEMA } from './content-schemas';
import type { AssetRow } from './content-types';

export function getAdminStorageStatus(): StorageStatus {
  return getStorageStatus(createAdminStorageProvider());
}

/**
 * Añade una URL firmada temporal de preview para imágenes (generada en
 * servidor; la key privada de Storage nunca llega al navegador). Si
 * Storage no está configurado o la generación falla, devuelve null sin
 * romper la página y registra solo un marcador seguro.
 */
export async function attachAssetPreview(asset: AssetRow): Promise<AssetRow> {
  if (!asset.mimeType.startsWith('image/')) {
    return { ...asset, previewUrl: null };
  }
  const provider = createAdminStorageProvider();
  if (provider === null) {
    return { ...asset, previewUrl: null };
  }
  try {
    const previewUrl = await provider.getSignedUrl(asset.storageKey, 3600);
    return { ...asset, previewUrl };
  } catch (error) {
    console.error(
      '[admin-contenido] no se pudo generar preview del activo.',
      error instanceof Error ? error.name : 'unknown',
    );
    return { ...asset, previewUrl: null };
  }
}

export async function createSignedAssetUpload(input: unknown) {
  const parsed = ASSET_UPLOAD_REQUEST_SCHEMA.parse(input);
  const provider = createAdminStorageProvider();
  if (!provider) {
    throw new Error('400: Storage no está configurado para el panel.');
  }
  const signed = await provider.createSignedUpload({
    key: buildAssetStorageKey(parsed.filename),
  });
  return {
    ...signed,
    filename: parsed.filename,
    mimeType: parsed.mimeType,
    sizeBytes: parsed.sizeBytes,
    altText: parsed.altText,
  };
}
