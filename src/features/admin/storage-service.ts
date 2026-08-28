import 'server-only';

import { createAdminStorageProvider } from '@/integrations/storage/supabase-storage';
import { buildAssetStorageKey } from '@/integrations/storage/supabase-storage';
import { getStorageStatus } from './storage-contract';
import type { StorageStatus } from './storage-contract';
import { ASSET_UPLOAD_REQUEST_SCHEMA } from './content-schemas';

export function getAdminStorageStatus(): StorageStatus {
  return getStorageStatus(createAdminStorageProvider());
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
