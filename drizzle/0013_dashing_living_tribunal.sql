CREATE TABLE "private"."engagement_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"requester_user_id" uuid NOT NULL,
	"requester_email" text NOT NULL,
	"requester_name" text NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"details" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "engagement_requests_type_check" CHECK ("private"."engagement_requests"."type" IN ('community', 'event', 'radio', 'market')),
	CONSTRAINT "engagement_requests_status_check" CHECK ("private"."engagement_requests"."status" IN ('pending', 'contacted', 'closed'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "engagement_requests_requester_unique" ON "private"."engagement_requests" USING btree ("type","requester_user_id","reference");--> statement-breakpoint
CREATE INDEX "engagement_requests_status_created_idx" ON "private"."engagement_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "engagement_requests_type_reference_idx" ON "private"."engagement_requests" USING btree ("type","reference");--> statement-breakpoint
REVOKE ALL ON TABLE "private"."engagement_requests" FROM PUBLIC, anon, authenticated;
