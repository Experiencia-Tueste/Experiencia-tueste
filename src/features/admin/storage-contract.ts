/**
 * Contrato de almacenamiento de activos — provider-neutral.
 * ---------------------------------------------------------------------
 * Define lo que cualquier proveedor (Supabase Storage, S3, etc.) deberá
 * implementar. NO hay implementación real todavía: requiere credenciales
 * nuevas no configuradas (claves de Storage), por lo que la subida y las
 * URLs firmadas quedan documentadas como paso pendiente.
 *
 * Nada de esto llega al cliente: los secretos del proveedor son
 * exclusivamente server-side.
 */

export interface StoredAssetInput {
  /** Clave de almacenamiento en el proveedor (bucket + objeto). */
  key: string;
  /** Bytes del archivo. */
  data: Uint8Array;
  mimeType: string;
}

export interface StorageProvider {
  /** Sube un archivo y devuelve su clave estable. */
  put(input: StoredAssetInput): Promise<{ key: string }>;
  /** Crea un token temporal para subir el archivo desde el navegador. */
  createSignedUpload(input: { key: string }): Promise<{
    bucket: string;
    path: string;
    token: string;
    storageKey: string;
  }>;
  /** Devuelve una URL firmada de lectura (expiración en segundos). */
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
}

export interface StorageStatus {
  configured: boolean;
  provider: 'supabase' | null;
}

/**
 * El contrato vive en dominio puro; la implementacion concreta se crea
 * en `src/integrations/storage/*` para no acoplar el dominio a Supabase.
 */
export function getStorageStatus(provider: StorageProvider | null): StorageStatus {
  return { configured: provider !== null, provider: provider ? 'supabase' : null };
}
