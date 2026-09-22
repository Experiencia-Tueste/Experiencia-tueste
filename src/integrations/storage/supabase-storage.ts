import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { loadAdminStorageConfig } from '@/lib/config/env-server';
import type { AdminStorageConfig } from '@/lib/config/env-server';
import type {
  StorageObjectMetadata,
  StorageProvider,
  StoredAssetInput,
} from '@/features/admin/storage-contract';

/**
 * `getObjectMetadata` se llama desde `assertMarketListingImageStored`
 * mientras una transacción sostiene `FOR UPDATE` sobre la fila del listing
 * (ver `operations-service.ts`). El SDK de Storage no expone un `signal`
 * para `.info()`, así que el timeout se implementa acá: si Storage no
 * responde a tiempo, la promesa se rechaza y la transacción se libera en
 * vez de quedar colgada indefinidamente sosteniendo el lock de fila.
 */
const OBJECT_METADATA_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function sanitizePathPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildAssetStorageKey(filename: string, now = new Date()): string {
  const safeFilename = sanitizePathPart(filename) || 'asset';
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const stamp = String(now.getTime());
  return `admin-assets/${year}/${month}/${stamp}-${safeFilename}`;
}

/**
 * Construye la clave de Storage para la imagen de un listing de vendedor,
 * siempre bajo `vendors/{vendorId}/…`. `vendorId` debe salir del admin
 * autenticado (nunca de input del cliente) — ver `market-image-service.ts`.
 */
export function buildVendorImageStorageKey(
  vendorId: string,
  filename: string,
  now = new Date(),
): string {
  const safeFilename = sanitizePathPart(filename) || 'imagen';
  const stamp = String(now.getTime());
  return `vendors/${vendorId}/${stamp}-${safeFilename}`;
}

export class SupabaseStorageProvider implements StorageProvider {
  private readonly client;
  private readonly bucket: string;

  constructor(config: AdminStorageConfig) {
    this.bucket = config.bucket;
    this.client = createClient(config.supabaseUrl, config.adminKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async put(input: StoredAssetInput): Promise<{ key: string }> {
    const { error } = await this.client.storage.from(this.bucket).upload(input.key, input.data, {
      contentType: input.mimeType,
      upsert: false,
    });
    if (error) throw error;
    return { key: `${this.bucket}/${input.key}` };
  }

  async createSignedUpload(input: { key: string }): Promise<{
    bucket: string;
    path: string;
    token: string;
    storageKey: string;
  }> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUploadUrl(input.key, { upsert: false });
    if (error) throw error;
    return {
      bucket: this.bucket,
      path: input.key,
      token: data.token,
      storageKey: `${this.bucket}/${input.key}`,
    };
  }

  async getSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    const path = key.startsWith(`${this.bucket}/`) ? key.slice(this.bucket.length + 1) : key;
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresInSeconds);
    if (error) throw error;
    return data.signedUrl;
  }

  async getObjectMetadata(key: string): Promise<StorageObjectMetadata | null> {
    const path = key.startsWith(`${this.bucket}/`) ? key.slice(this.bucket.length + 1) : key;
    const { data, error } = await withTimeout(
      this.client.storage.from(this.bucket).info(path),
      OBJECT_METADATA_TIMEOUT_MS,
      '503: tiempo de espera agotado al verificar la imagen en Storage.',
    );
    if (error) {
      const status = (error as { status?: number }).status;
      if (status === 404 || status === 400) return null;
      throw error;
    }
    return { size: data.size ?? 0, contentType: data.contentType ?? null };
  }
}

export function createAdminStorageProvider(): StorageProvider | null {
  const config = loadAdminStorageConfig();
  return config ? new SupabaseStorageProvider(config) : null;
}
