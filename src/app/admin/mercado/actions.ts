'use server';

import { revalidatePath } from 'next/cache';
import {
  changeMarketListingStatus,
  createMarketListing,
  createVendorListing,
  submitVendorListingForReview,
  updateVendorListing,
} from '@/features/admin/operations-service';
import { createVendorImageSignedUpload } from '@/features/admin/market-image-service';

const refresh = () => {
  revalidatePath('/admin/mercado');
  revalidatePath('/admin');
};

export interface VendorImageUploadResult {
  ok?: boolean;
  error?: string;
  upload?: {
    bucket: string;
    path: string;
    token: string;
    storageKey: string;
    imagePath: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
  };
}

/** Códigos del servicio cuyo mensaje ya es seguro y útil para la interfaz. */
const CONTROLLED_ERROR_CODES = new Set(['400', '401', '403', '503']);

function safeUploadErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  const code = message.match(/^(\d{3}): /)?.[1];
  if (code !== undefined && CONTROLLED_ERROR_CODES.has(code)) return message;
  console.error(
    '[admin-mercado] error inesperado al preparar la subida de imagen.',
    error instanceof Error ? error.name : 'unknown',
  );
  return 'No pudimos preparar la subida de la imagen. Inténtalo de nuevo.';
}

/**
 * Pide una URL firmada de subida hacia el prefijo del vendedor autenticado
 * (`vendors/{vendorId}/…`). El `vendorId` nunca sale del formulario.
 */
export async function requestVendorImageUploadAction(
  data: FormData,
): Promise<VendorImageUploadResult> {
  try {
    const upload = await createVendorImageSignedUpload({
      filename: data.get('filename'),
      mimeType: data.get('mimeType'),
      sizeBytes: data.get('sizeBytes'),
    });
    return { ok: true, upload };
  } catch (error) {
    return { error: safeUploadErrorMessage(error) };
  }
}

export async function createMarketListingAction(data: FormData) {
  await createMarketListing(Object.fromEntries(data));
  refresh();
}
export async function changeMarketStatusAction(data: FormData) {
  await changeMarketListingStatus(Object.fromEntries(data));
  refresh();
}

export async function createVendorListingAction(data: FormData) {
  await createVendorListing(Object.fromEntries(data));
  refresh();
}

export async function updateVendorListingAction(data: FormData) {
  await updateVendorListing(Object.fromEntries(data));
  refresh();
}

export async function submitVendorListingForReviewAction(data: FormData) {
  await submitVendorListingForReview(Object.fromEntries(data));
  refresh();
}
