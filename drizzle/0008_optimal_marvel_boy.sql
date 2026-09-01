ALTER TABLE "private"."releases" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "private"."releases" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "private"."releases" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "private"."releases" ADD CONSTRAINT "releases_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_entries_schedule_idx" ON "private"."content_entries" USING btree ("scheduled_at") WHERE "private"."content_entries"."status" = 'review' AND "private"."content_entries"."scheduled_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "releases_status_idx" ON "private"."releases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "releases_schedule_idx" ON "private"."releases" USING btree ("scheduled_at") WHERE "private"."releases"."status" = 'review' AND "private"."releases"."scheduled_at" IS NOT NULL;