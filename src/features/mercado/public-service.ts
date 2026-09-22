import 'server-only';

import {
  getPublicMarketRepository,
  type PublishedMarketListingRecord,
} from '@/db/public-market-repository';
import { createAdminStorageProvider } from '@/integrations/storage/supabase-storage';
import type { PublicMarketListing } from './index';

const PUBLIC_MARKET_IMAGE_TTL_SECONDS = 60 * 60;

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function imageUrl(record: PublishedMarketListingRecord) {
  if (!record.imagePath) return null;
  try {
    const provider = createAdminStorageProvider();
    if (!provider) return null;
    return await provider.getSignedUrl(record.imagePath, PUBLIC_MARKET_IMAGE_TTL_SECONDS);
  } catch (error) {
    console.error(
      '[public-market] no se pudo firmar la imagen publicada.',
      error instanceof Error ? error.name : 'unknown',
    );
    return null;
  }
}

function toPublicListing(record: PublishedMarketListingRecord): Promise<PublicMarketListing> {
  return imageUrl(record).then((signedImageUrl) => ({
    id: record.id,
    slug: `${slugify(record.title) || 'producto'}-${record.id.slice(0, 8)}`,
    title: record.title,
    vendorName: record.vendorName,
    brand: record.brand,
    category: record.category,
    variety: record.variety,
    process: record.process,
    origin: record.origin,
    presentation: record.presentation,
    weightGrams: record.weightGrams,
    inventory: record.inventory,
    priceCents: record.priceCents,
    imageUrl: signedImageUrl,
    delivery: record.delivery,
    traceability: record.traceability,
  }));
}

/** Proyección pública canónica: solo vendedor activo, publicado y disponible. */
export async function getPublicMarketCatalog(limit = 24): Promise<PublicMarketListing[]> {
  const rows = await getPublicMarketRepository().listPublished(limit);
  return Promise.all(rows.map(toPublicListing));
}

/** Busca una publicación publicable para canonicalizar una solicitud. */
export async function findPublicMarketListing(id: string) {
  const row = await getPublicMarketRepository().findPublishedById(id);
  return row ? toPublicListing(row) : null;
}
