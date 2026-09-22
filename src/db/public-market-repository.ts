import 'server-only';

import { and, desc, eq, gt } from 'drizzle-orm';

import { getDb } from './client';
import type { DbClient } from './db-types';
import { vendors } from './schema/admin-identity';
import { marketListings } from './schema/admin-operations';

export interface PublishedMarketListingRecord {
  id: string;
  title: string;
  vendorId: string;
  vendorName: string;
  brand: string;
  category: string;
  variety: string;
  process: string;
  origin: string;
  presentation: string;
  weightGrams: number;
  inventory: number;
  priceCents: number;
  imagePath: string | null;
  delivery: string;
  traceability: string;
  updatedAt: Date;
}

function publicMarketPredicate() {
  return and(
    eq(marketListings.status, 'published'),
    eq(vendors.status, 'active'),
    gt(marketListings.inventory, 0),
  );
}

function selectPublishedMarket() {
  return {
    id: marketListings.id,
    title: marketListings.title,
    vendorId: marketListings.vendorId,
    vendorName: vendors.name,
    brand: marketListings.brand,
    category: marketListings.category,
    variety: marketListings.variety,
    process: marketListings.process,
    origin: marketListings.origin,
    presentation: marketListings.presentation,
    weightGrams: marketListings.weightGrams,
    inventory: marketListings.inventory,
    priceCents: marketListings.priceCents,
    imagePath: marketListings.imagePath,
    delivery: marketListings.delivery,
    traceability: marketListings.traceability,
    updatedAt: marketListings.updatedAt,
  };
}

export class DrizzlePublicMarketRepository {
  async listPublished(limit = 24): Promise<PublishedMarketListingRecord[]> {
    return getDb()
      .select(selectPublishedMarket())
      .from(marketListings)
      .innerJoin(vendors, eq(marketListings.vendorId, vendors.id))
      .where(publicMarketPredicate())
      .orderBy(desc(marketListings.updatedAt))
      .limit(limit);
  }

  async findPublishedById(
    id: string,
    client: DbClient = getDb(),
  ): Promise<PublishedMarketListingRecord | null> {
    const [row] = await client
      .select(selectPublishedMarket())
      .from(marketListings)
      .innerJoin(vendors, eq(marketListings.vendorId, vendors.id))
      .where(and(eq(marketListings.id, id), publicMarketPredicate()))
      .limit(1);
    return row ?? null;
  }
}

export function getPublicMarketRepository() {
  return new DrizzlePublicMarketRepository();
}
