CREATE TABLE "private"."analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"event_name" text NOT NULL,
	"event_version" integer DEFAULT 1 NOT NULL,
	"source" text DEFAULT 'web' NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "analytics_events_version_check" CHECK ("private"."analytics_events"."event_version" > 0),
	CONSTRAINT "analytics_events_source_check" CHECK ("private"."analytics_events"."source" IN ('web', 'server'))
);
--> statement-breakpoint
CREATE TABLE "private"."operational_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"route" text NOT NULL,
	"operation" text NOT NULL,
	"status" integer NOT NULL,
	"error_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "operational_errors_status_check" CHECK ("private"."operational_errors"."status" >= 400 AND "private"."operational_errors"."status" <= 599)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_events_event_id_unique" ON "private"."analytics_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "analytics_events_name_created_idx" ON "private"."analytics_events" USING btree ("event_name","created_at");--> statement-breakpoint
CREATE INDEX "operational_errors_route_created_idx" ON "private"."operational_errors" USING btree ("route","created_at");--> statement-breakpoint
CREATE INDEX "operational_errors_request_idx" ON "private"."operational_errors" USING btree ("request_id");--> statement-breakpoint
ALTER TABLE "private"."analytics_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "private"."operational_errors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."analytics_events", "private"."operational_errors" FROM PUBLIC, anon, authenticated;
