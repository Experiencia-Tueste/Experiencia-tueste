ALTER TABLE "private"."content_entries" ADD COLUMN "scheduled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "private"."releases" ADD COLUMN "scheduled_at" timestamp with time zone;