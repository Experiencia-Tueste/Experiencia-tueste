CREATE TABLE "private"."events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"city" text NOT NULL,
	"venue" text NOT NULL,
	"capacity" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_status_check" CHECK ("private"."events"."status" IN ('draft', 'open', 'waitlist', 'closed', 'cancelled')),
	CONSTRAINT "events_capacity_check" CHECK ("private"."events"."capacity" IS NULL OR "private"."events"."capacity" > 0),
	CONSTRAINT "events_dates_check" CHECK ("private"."events"."ends_at" IS NULL OR "private"."events"."ends_at" > "private"."events"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "private"."event_attendees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"ticket_code" uuid DEFAULT gen_random_uuid() NOT NULL,
	"status" text DEFAULT 'reserved' NOT NULL,
	"checked_in_at" timestamp with time zone,
	"checked_in_by" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_attendees_status_check" CHECK ("private"."event_attendees"."status" IN ('reserved', 'waitlisted', 'checked_in', 'cancelled'))
);
--> statement-breakpoint
ALTER TABLE "private"."events" ADD CONSTRAINT "events_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."events" ADD CONSTRAINT "events_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."event_attendees" ADD CONSTRAINT "event_attendees_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "private"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."event_attendees" ADD CONSTRAINT "event_attendees_checked_in_by_admin_users_id_fk" FOREIGN KEY ("checked_in_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."event_attendees" ADD CONSTRAINT "event_attendees_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_unique" ON "private"."events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_starts_at_idx" ON "private"."events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "private"."events" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "event_attendees_event_email_unique" ON "private"."event_attendees" USING btree ("event_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "event_attendees_ticket_code_unique" ON "private"."event_attendees" USING btree ("ticket_code");--> statement-breakpoint
CREATE INDEX "event_attendees_event_status_idx" ON "private"."event_attendees" USING btree ("event_id","status");--> statement-breakpoint
REVOKE ALL ON TABLE "private"."events" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."event_attendees" FROM anon, authenticated;
