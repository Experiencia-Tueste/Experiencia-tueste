import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { loadAdminStorageConfig } from '@/lib/config/env-server';
import type { AdminStorageConfig } from '@/lib/config/env-server';
import type { StorageProvider, StoredAssetInput } from '@/features/admin/storage-contract';

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
}

export function createAdminStorageProvider(): StorageProvider | null {
  const config = loadAdminStorageConfig();
  return config ? new SupabaseStorageProvider(config) : null;
}
