CREATE TABLE "private"."auction_bids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auction_id" uuid NOT NULL,
	"bidder_name" text NOT NULL,
	"bidder_email" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auction_bids_amount_check" CHECK ("private"."auction_bids"."amount_cents" > 0)
);
--> statement-breakpoint
CREATE TABLE "private"."auction_lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lot_id" uuid,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"reserve_cents" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auction_lots_dates_check" CHECK ("private"."auction_lots"."ends_at" > "private"."auction_lots"."starts_at"),
	CONSTRAINT "auction_lots_reserve_check" CHECK ("private"."auction_lots"."reserve_cents" > 0),
	CONSTRAINT "auction_lots_status_check" CHECK ("private"."auction_lots"."status" IN ('draft', 'approved', 'open', 'closed', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "private"."backstage_passes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"holder_name" text NOT NULL,
	"holder_email" text NOT NULL,
	"zone" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"notes" text,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "backstage_passes_dates_check" CHECK ("private"."backstage_passes"."ends_at" > "private"."backstage_passes"."starts_at"),
	CONSTRAINT "backstage_passes_status_check" CHECK ("private"."backstage_passes"."status" IN ('requested', 'approved', 'issued', 'revoked', 'expired'))
);
--> statement-breakpoint
CREATE TABLE "private"."market_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"inventory" integer DEFAULT 0 NOT NULL,
	"price_cents" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "market_listings_inventory_check" CHECK ("private"."market_listings"."inventory" >= 0),
	CONSTRAINT "market_listings_price_check" CHECK ("private"."market_listings"."price_cents" > 0),
	CONSTRAINT "market_listings_status_check" CHECK ("private"."market_listings"."status" IN ('draft', 'review', 'published', 'paused', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "private"."tree_adoptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lot_id" uuid NOT NULL,
	"adopter_name" text NOT NULL,
	"adopter_email" text NOT NULL,
	"trees_count" integer DEFAULT 1 NOT NULL,
	"certificate_code" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tree_adoptions_count_check" CHECK ("private"."tree_adoptions"."trees_count" > 0),
	CONSTRAINT "tree_adoptions_status_check" CHECK ("private"."tree_adoptions"."status" IN ('pending', 'active', 'fulfilled', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "private"."unity_opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"service" text NOT NULL,
	"stage" text DEFAULT 'lead' NOT NULL,
	"estimated_value_cents" integer,
	"next_step" text,
	"next_contact_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unity_opportunities_stage_check" CHECK ("private"."unity_opportunities"."stage" IN ('lead', 'qualified', 'proposal', 'won', 'lost')),
	CONSTRAINT "unity_opportunities_value_check" CHECK ("private"."unity_opportunities"."estimated_value_cents" IS NULL OR "private"."unity_opportunities"."estimated_value_cents" >= 0)
);
--> statement-breakpoint
ALTER TABLE "private"."auction_bids" ADD CONSTRAINT "auction_bids_auction_id_auction_lots_id_fk" FOREIGN KEY ("auction_id") REFERENCES "private"."auction_lots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."auction_bids" ADD CONSTRAINT "auction_bids_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."auction_lots" ADD CONSTRAINT "auction_lots_lot_id_farm_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "private"."farm_lots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."auction_lots" ADD CONSTRAINT "auction_lots_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."auction_lots" ADD CONSTRAINT "auction_lots_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."backstage_passes" ADD CONSTRAINT "backstage_passes_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "private"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."backstage_passes" ADD CONSTRAINT "backstage_passes_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."backstage_passes" ADD CONSTRAINT "backstage_passes_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."market_listings" ADD CONSTRAINT "market_listings_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "private"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."market_listings" ADD CONSTRAINT "market_listings_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."market_listings" ADD CONSTRAINT "market_listings_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."tree_adoptions" ADD CONSTRAINT "tree_adoptions_lot_id_farm_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "private"."farm_lots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."tree_adoptions" ADD CONSTRAINT "tree_adoptions_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."tree_adoptions" ADD CONSTRAINT "tree_adoptions_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."unity_opportunities" ADD CONSTRAINT "unity_opportunities_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."unity_opportunities" ADD CONSTRAINT "unity_opportunities_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auction_bids_auction_amount_idx" ON "private"."auction_bids" USING btree ("auction_id","amount_cents");--> statement-breakpoint
CREATE INDEX "auction_lots_status_starts_idx" ON "private"."auction_lots" USING btree ("status","starts_at");--> statement-breakpoint
CREATE INDEX "backstage_passes_status_starts_idx" ON "private"."backstage_passes" USING btree ("status","starts_at");--> statement-breakpoint
CREATE INDEX "backstage_passes_event_idx" ON "private"."backstage_passes" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "market_listings_vendor_status_idx" ON "private"."market_listings" USING btree ("vendor_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "tree_adoptions_certificate_unique" ON "private"."tree_adoptions" USING btree ("certificate_code");--> statement-breakpoint
CREATE INDEX "tree_adoptions_lot_status_idx" ON "private"."tree_adoptions" USING btree ("lot_id","status");--> statement-breakpoint
CREATE INDEX "tree_adoptions_email_idx" ON "private"."tree_adoptions" USING btree ("adopter_email");--> statement-breakpoint
CREATE INDEX "unity_opportunities_stage_contact_idx" ON "private"."unity_opportunities" USING btree ("stage","next_contact_at");--> statement-breakpoint
CREATE INDEX "unity_opportunities_email_idx" ON "private"."unity_opportunities" USING btree ("contact_email");--> statement-breakpoint
REVOKE ALL ON TABLE "private"."tree_adoptions" FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."market_listings" FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."unity_opportunities" FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."auction_lots" FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."auction_bids" FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."backstage_passes" FROM PUBLIC, anon, authenticated;
