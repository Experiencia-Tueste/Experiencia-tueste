CREATE TABLE "private"."pending_engagement_intents" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "private"."request_rate_limit_buckets" (
	"bucket_key" text PRIMARY KEY NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "pending_engagement_intents_expires_idx" ON "private"."pending_engagement_intents" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "request_rate_limit_buckets_updated_idx" ON "private"."request_rate_limit_buckets" USING btree ("updated_at");--> statement-breakpoint
REVOKE ALL ON TABLE "private"."pending_engagement_intents", "private"."request_rate_limit_buckets" FROM PUBLIC, anon, authenticated;
