CREATE TABLE "private"."assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_key" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"alt_text" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assets_status_check" CHECK ("private"."assets"."status" IN ('pending', 'approved', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "private"."content_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"body" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_entries_status_check" CHECK ("private"."content_entries"."status" IN ('draft', 'review', 'published', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "private"."releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"cover_asset_id" uuid,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "releases_status_check" CHECK ("private"."releases"."status" IN ('draft', 'review', 'published', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "private"."tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_id" uuid NOT NULL,
	"title" text NOT NULL,
	"duration_seconds" integer,
	"hz" integer,
	"audio_asset_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "private"."assets" ADD CONSTRAINT "assets_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."content_entries" ADD CONSTRAINT "content_entries_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."content_entries" ADD CONSTRAINT "content_entries_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."releases" ADD CONSTRAINT "releases_cover_asset_id_assets_id_fk" FOREIGN KEY ("cover_asset_id") REFERENCES "private"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."releases" ADD CONSTRAINT "releases_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."tracks" ADD CONSTRAINT "tracks_release_id_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "private"."releases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."tracks" ADD CONSTRAINT "tracks_audio_asset_id_assets_id_fk" FOREIGN KEY ("audio_asset_id") REFERENCES "private"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assets_status_idx" ON "private"."assets" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "content_entries_slug_unique" ON "private"."content_entries" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "content_entries_status_idx" ON "private"."content_entries" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "releases_slug_unique" ON "private"."releases" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tracks_release_id_idx" ON "private"."tracks" USING btree ("release_id");