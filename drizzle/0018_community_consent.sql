CREATE TABLE "private"."community_consent_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"requester_user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"preferences" jsonb NOT NULL,
	"consent_version" integer NOT NULL,
	"source" text NOT NULL,
	"actor_admin_id" uuid,
	"reason" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_consent_events_action_check" CHECK ("private"."community_consent_events"."action" IN ('granted', 'preferences_updated', 'withdrawn', 'restored')),
	CONSTRAINT "community_consent_events_source_check" CHECK ("private"."community_consent_events"."source" IN ('public', 'admin')),
	CONSTRAINT "community_consent_events_version_check" CHECK ("private"."community_consent_events"."consent_version" > 0)
);
--> statement-breakpoint
DROP INDEX "private"."community_members_email_unique";--> statement-breakpoint
ALTER TABLE "private"."community_members" ADD COLUMN "requester_user_id" uuid;--> statement-breakpoint
ALTER TABLE "private"."community_members" ADD COLUMN "source_request_id" uuid;--> statement-breakpoint
ALTER TABLE "private"."community_members" ADD COLUMN "preferences" jsonb DEFAULT '["general"]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "private"."community_members" ADD COLUMN "consent_status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "private"."community_members" ADD COLUMN "consent_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "private"."community_members" ADD COLUMN "consented_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "private"."community_members" ADD COLUMN "withdrawn_at" timestamp with time zone;--> statement-breakpoint
UPDATE "private"."community_members"
SET "consent_status" = 'withdrawn', "withdrawn_at" = COALESCE("updated_at", now())
WHERE "requester_user_id" IS NULL;--> statement-breakpoint
ALTER TABLE "private"."community_consent_events" ADD CONSTRAINT "community_consent_events_member_id_community_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "private"."community_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."community_consent_events" ADD CONSTRAINT "community_consent_events_actor_admin_id_admin_users_id_fk" FOREIGN KEY ("actor_admin_id") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_consent_events_member_idx" ON "private"."community_consent_events" USING btree ("member_id","occurred_at");--> statement-breakpoint
CREATE INDEX "community_consent_events_user_idx" ON "private"."community_consent_events" USING btree ("requester_user_id","occurred_at");--> statement-breakpoint
ALTER TABLE "private"."community_members" ADD CONSTRAINT "community_members_source_request_id_engagement_requests_id_fk" FOREIGN KEY ("source_request_id") REFERENCES "private"."engagement_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_members_email_idx" ON "private"."community_members" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "community_members_requester_user_unique" ON "private"."community_members" USING btree ("requester_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "community_members_source_request_unique" ON "private"."community_members" USING btree ("source_request_id");--> statement-breakpoint
CREATE INDEX "community_members_consent_status_idx" ON "private"."community_members" USING btree ("consent_status");--> statement-breakpoint
ALTER TABLE "private"."community_members" ADD CONSTRAINT "community_members_consent_status_check" CHECK ("private"."community_members"."consent_status" IN ('active', 'withdrawn'));--> statement-breakpoint
ALTER TABLE "private"."community_members" ADD CONSTRAINT "community_members_consent_version_check" CHECK ("private"."community_members"."consent_version" > 0);
