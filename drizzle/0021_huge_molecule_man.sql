ALTER TABLE "private"."market_listings" ADD COLUMN "brand" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "private"."market_listings" ADD COLUMN "variety" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "private"."market_listings" ADD COLUMN "process" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "private"."market_listings" ADD COLUMN "origin" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "private"."market_listings" ADD COLUMN "presentation" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "private"."market_listings" ADD COLUMN "weight_grams" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "private"."market_listings" ADD COLUMN "image_path" text;--> statement-breakpoint
ALTER TABLE "private"."market_listings" ADD COLUMN "image_size_bytes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "private"."market_listings" ADD COLUMN "delivery" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "private"."market_listings" ADD COLUMN "traceability" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "private"."market_listings" ADD CONSTRAINT "market_listings_weight_check" CHECK ("private"."market_listings"."weight_grams" >= 0);--> statement-breakpoint
ALTER TABLE "private"."market_listings" ADD CONSTRAINT "market_listings_image_size_check" CHECK ("private"."market_listings"."image_size_bytes" >= 0 AND "private"."market_listings"."image_size_bytes" <= 5000000);