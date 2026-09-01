CREATE TABLE "private"."community_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_members_status_check" CHECK ("private"."community_members"."status" IN ('active', 'restricted', 'banned'))
);
--> statement-breakpoint
CREATE TABLE "private"."community_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid,
	"author_name" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'visible' NOT NULL,
	"report_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_posts_status_check" CHECK ("private"."community_posts"."status" IN ('visible', 'hidden', 'removed')),
	CONSTRAINT "community_posts_report_count_check" CHECK ("private"."community_posts"."report_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "private"."community_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"reporter_name" text NOT NULL,
	"category" text NOT NULL,
	"details" text,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution" text,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_reports_status_check" CHECK ("private"."community_reports"."status" IN ('open', 'resolved', 'dismissed'))
);
--> statement-breakpoint
ALTER TABLE "private"."community_members" ADD CONSTRAINT "community_members_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."community_posts" ADD CONSTRAINT "community_posts_member_id_community_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "private"."community_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."community_posts" ADD CONSTRAINT "community_posts_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."community_reports" ADD CONSTRAINT "community_reports_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "private"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."community_reports" ADD CONSTRAINT "community_reports_resolved_by_admin_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."community_reports" ADD CONSTRAINT "community_reports_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "community_members_email_unique" ON "private"."community_members" USING btree ("email");--> statement-breakpoint
CREATE INDEX "community_members_status_idx" ON "private"."community_members" USING btree ("status");--> statement-breakpoint
CREATE INDEX "community_members_created_by_idx" ON "private"."community_members" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "community_posts_member_id_idx" ON "private"."community_posts" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "community_posts_status_idx" ON "private"."community_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "community_posts_created_at_idx" ON "private"."community_posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "community_posts_created_by_idx" ON "private"."community_posts" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "community_reports_post_status_idx" ON "private"."community_reports" USING btree ("post_id","status");--> statement-breakpoint
CREATE INDEX "community_reports_status_idx" ON "private"."community_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "community_reports_resolved_by_idx" ON "private"."community_reports" USING btree ("resolved_by");--> statement-breakpoint
CREATE INDEX "community_reports_created_by_idx" ON "private"."community_reports" USING btree ("created_by");--> statement-breakpoint
REVOKE ALL ON TABLE "private"."community_members" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."community_posts" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."community_reports" FROM anon, authenticated;
