/**
 * Contrato de almacenamiento de activos — provider-neutral.
 * ---------------------------------------------------------------------
 * Define lo que cualquier proveedor (Supabase Storage, S3, etc.) debe
 * implementar. La implementación concreta actual vive en
 * `src/integrations/storage/supabase-storage.ts` (Supabase Storage:
 * subida con URL firmada y URLs de lectura firmadas); las credenciales
 * del proveedor son exclusivamente server-side y nunca llegan al
 * cliente. Sin credenciales configuradas, el panel opera sin Storage
 * (fail cerrado, sin subidas).
 */

export interface StoredAssetInput {
  /** Clave de almacenamiento en el proveedor (bucket + objeto). */
  key: string;
  /** Bytes del archivo. */
  data: Uint8Array;
  mimeType: string;
}

/** Metadata real de un objeto ya subido, reportada por el proveedor (no por el cliente). */
export interface StorageObjectMetadata {
  size: number;
  contentType: string | null;
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
  /**
   * Metadata real del objeto (tamaño, content-type) consultada directamente
   * al proveedor; `null` si el objeto no existe. Nunca confiar en metadata
   * declarada por el cliente para decisiones de negocio — esto es la
   * verificación server-side contra el propio Storage.
   */
  getObjectMetadata(key: string): Promise<StorageObjectMetadata | null>;
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
